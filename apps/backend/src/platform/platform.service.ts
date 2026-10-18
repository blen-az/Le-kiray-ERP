import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/current-user.decorator';
import { OWNER_ROLE } from '../auth/permission-registry';
import { generateTemporaryPassword } from '../users/users.service';
import { SecurityLoggerService, SecurityEventType } from '../common/logger/security-logger.service';
import { provisionCompanyAccess } from './tenant-provisioning';
import { OnboardCompanyDto, ResetOwnerPasswordDto, UpdateCompanyDto } from './dto/platform.dto';

const optional = (v?: string) => (v === undefined ? undefined : v.trim() || null);

@Injectable()
export class PlatformService {
  constructor(
    private prisma: PrismaService,
    private securityLogger: SecurityLoggerService,
  ) {}

  async listCompanies() {
    const companies = await this.prisma.company.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { projects: { where: { deletedAt: null } } } },
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            isActive: true,
            mustChangePassword: true,
            lastLoginAt: true,
            roles: { select: { role: { select: { name: true } } } },
          },
        },
      },
    });

    return companies.map(({ users, _count, ...c }) => {
      const lastActive = users.reduce<Date | null>(
        (latest, u) => (u.lastLoginAt && (!latest || u.lastLoginAt > latest) ? u.lastLoginAt : latest),
        null,
      );
      return {
        ...c,
        userCount: users.length,
        activeUserCount: users.filter((u) => u.isActive).length,
        projectCount: _count.projects,
        lastActiveAt: lastActive,
        owners: users
          .filter((u) => u.roles.some((r) => r.role.name === OWNER_ROLE))
          .map(({ roles, ...u }) => u),
      };
    });
  }

  async stats() {
    const [companies, active, suspended, users] = await Promise.all([
      this.prisma.company.count({ where: { deletedAt: null } }),
      this.prisma.company.count({ where: { deletedAt: null, status: 'Active' } }),
      this.prisma.company.count({ where: { deletedAt: null, status: 'Suspended' } }),
      this.prisma.user.count({ where: { deletedAt: null, isActive: true, company: { deletedAt: null } } }),
    ]);
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeLast30Days = await this.prisma.company.count({
      where: { deletedAt: null, users: { some: { lastLoginAt: { gte: since } } } },
    });
    return { companies, active, suspended, users, activeLast30Days };
  }

  async onboard(actor: AuthenticatedUser, dto: OnboardCompanyDto) {
    const companyName = dto.companyName.trim();
    const ownerEmail = dto.ownerEmail.trim().toLowerCase();

    const [nameClash, emailClash] = await Promise.all([
      this.prisma.company.findFirst({ where: { deletedAt: null, name: { equals: companyName, mode: 'insensitive' } } }),
      this.prisma.user.findFirst({ where: { email: { equals: ownerEmail, mode: 'insensitive' } } }),
    ]);
    if (nameClash) throw new ConflictException(`A company named "${nameClash.name}" already exists`);
    if (emailClash) throw new ConflictException('That owner email is already used by another account');

    const temporaryPassword = generateTemporaryPassword();
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(temporaryPassword, rounds);

    const { company, owner } = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName,
          country: 'Ethiopia',
          currency: 'ETB',
          tinNumber: optional(dto.tinNumber),
          licenseGrade: optional(dto.licenseGrade),
          city: optional(dto.city),
          phone: optional(dto.phone),
        },
      });
      const { ownerRoleId } = await provisionCompanyAccess(tx, company.id);
      const owner = await tx.user.create({
        data: {
          companyId: company.id,
          email: ownerEmail,
          firstName: dto.ownerFirstName.trim(),
          lastName: dto.ownerLastName.trim(),
          password: passwordHash,
          mustChangePassword: true,
          createdById: actor.id,
          roles: { create: { companyId: company.id, roleId: ownerRoleId, createdById: actor.id } },
        },
        select: { id: true, firstName: true, lastName: true, email: true },
      });
      return { company, owner };
    }, { timeout: 20000 });

    await this.audit(actor, company.id, 'COMPANY_ONBOARDED', `Onboarded ${company.name} with owner ${owner.email}`);

    // Temporary password is returned only here, once
    return { company, owner, temporaryPassword };
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateCompanyDto) {
    const company = await this.getCompany(id);

    if (dto.status === 'Suspended' && company.id === actor.companyId) {
      throw new BadRequestException('You cannot suspend the company your own account belongs to');
    }
    if (dto.name && dto.name.trim().toLowerCase() !== company.name.toLowerCase()) {
      const clash = await this.prisma.company.findFirst({
        where: { deletedAt: null, id: { not: id }, name: { equals: dto.name.trim(), mode: 'insensitive' } },
      });
      if (clash) throw new ConflictException(`A company named "${clash.name}" already exists`);
    }

    const suspending = dto.status === 'Suspended' && company.status !== 'Suspended';
    const reactivating = dto.status === 'Active' && company.status !== 'Active';

    const updated = await this.prisma.$transaction(async (tx) => {
      if (suspending) {
        // End every session in the company; access tokens lapse within 15 minutes
        await tx.user.updateMany({ where: { companyId: id }, data: { refreshToken: null } });
      }
      return tx.company.update({
        where: { id },
        data: {
          name: dto.name?.trim(),
          tinNumber: optional(dto.tinNumber),
          licenseGrade: optional(dto.licenseGrade),
          city: optional(dto.city),
          phone: optional(dto.phone),
          status: dto.status,
          suspendedAt: suspending ? new Date() : reactivating ? null : undefined,
        },
      });
    });

    if (suspending) await this.audit(actor, id, 'COMPANY_SUSPENDED', `Suspended ${updated.name}`);
    else if (reactivating) await this.audit(actor, id, 'COMPANY_REACTIVATED', `Reactivated ${updated.name}`);
    else await this.audit(actor, id, 'COMPANY_UPDATED', `Updated details for ${updated.name}`);

    return updated;
  }

  async resetOwnerPassword(actor: AuthenticatedUser, companyId: string, dto: ResetOwnerPasswordDto) {
    const company = await this.getCompany(companyId);
    const owner = await this.prisma.user.findFirst({
      where: {
        companyId,
        deletedAt: null,
        ...(dto.userId ? { id: dto.userId } : { isActive: true }),
        roles: { some: { role: { name: OWNER_ROLE } } },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (!owner) throw new NotFoundException(`No ${OWNER_ROLE} found for ${company.name}`);
    if (owner.id === actor.id) {
      throw new BadRequestException('Use "Change password" to change your own password');
    }

    const temporaryPassword = generateTemporaryPassword();
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    await this.prisma.user.update({
      where: { id: owner.id },
      data: {
        password: await bcrypt.hash(temporaryPassword, rounds),
        mustChangePassword: true,
        isActive: true,
        refreshToken: null,
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    await this.audit(actor, companyId, 'COMPANY_OWNER_PASSWORD_RESET', `Platform reset password for ${owner.email}`);

    return {
      owner: { id: owner.id, firstName: owner.firstName, lastName: owner.lastName, email: owner.email },
      temporaryPassword,
    };
  }

  private async getCompany(id: string) {
    const company = await this.prisma.company.findFirst({ where: { id, deletedAt: null } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  /** Recorded in the target company's audit log so its owner can see platform actions */
  private async audit(actor: AuthenticatedUser, companyId: string, action: string, message: string) {
    await this.prisma.auditLog.create({
      data: { companyId, userId: actor.id, action, details: JSON.stringify({ message, by: 'Le’Kiray platform' }) },
    });
    this.securityLogger.logSecurityEvent(SecurityEventType.USER_ADMIN_ACTION, {
      userId: actor.id,
      companyId,
      reason: `${action}: ${message}`,
    });
  }
}
