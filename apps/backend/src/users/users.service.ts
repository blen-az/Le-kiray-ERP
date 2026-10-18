import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/current-user.decorator';
import { OWNER_ROLE, SUPER_ADMIN_ROLE } from '../auth/permission-registry';
import { SecurityLoggerService, SecurityEventType } from '../common/logger/security-logger.service';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';

const USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  isActive: true,
  mustChangePassword: true,
  lastLoginAt: true,
  lockedUntil: true,
  createdAt: true,
  roles: { select: { role: { select: { id: true, name: true } } } },
} as const;

// No 0/O, 1/l/I — temporary passwords get read aloud and typed from paper
const TEMP_PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateTemporaryPassword(): string {
  for (;;) {
    const groups = Array.from({ length: 3 }, () =>
      Array.from({ length: 4 }, () => TEMP_PASSWORD_ALPHABET[randomInt(TEMP_PASSWORD_ALPHABET.length)]).join(''),
    );
    const password = groups.join('-');
    if (/[A-Za-z]/.test(password) && /\d/.test(password)) return password;
  }
}

type RoleWithPermissions = { id: string; name: string; permissions: { permission: { action: string } }[] };

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private securityLogger: SecurityLoggerService,
  ) {}

  findAll(companyId: string) {
    return this.prisma.user
      .findMany({
        where: { companyId, deletedAt: null },
        select: USER_SELECT,
        orderBy: [{ isActive: 'desc' }, { firstName: 'asc' }],
      })
      .then((users) => users.map(this.present));
  }

  async create(actor: AuthenticatedUser, dto: CreateUserDto) {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const roles = await this.loadAssignableRoles(actor, dto.roleIds);
    const temporaryPassword = generateTemporaryPassword();
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

    const user = await this.prisma.user.create({
      data: {
        companyId: actor.companyId,
        email,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        password: await bcrypt.hash(temporaryPassword, rounds),
        mustChangePassword: true,
        createdById: actor.id,
        roles: {
          create: roles.map((r) => ({ companyId: actor.companyId, roleId: r.id, createdById: actor.id })),
        },
      },
      select: USER_SELECT,
    });

    await this.audit(actor, 'USER_CREATED', `Added ${user.firstName} ${user.lastName} (${user.email}) as ${roles.map((r) => r.name).join(', ')}`);

    // The temporary password is only ever returned here, once
    return { user: this.present(user), temporaryPassword };
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateUserDto) {
    const target = await this.loadManageableUser(actor, id);
    const changes: string[] = [];

    let newRoles: RoleWithPermissions[] | undefined;
    if (dto.roleIds) {
      newRoles = await this.loadAssignableRoles(actor, dto.roleIds);
      const wasOwner = target.roles.some((ur) => ur.role.name === OWNER_ROLE);
      const staysOwner = newRoles.some((r) => r.name === OWNER_ROLE);
      if (wasOwner && !staysOwner) {
        if (target.id === actor.id) {
          throw new BadRequestException(`You cannot remove the ${OWNER_ROLE} role from yourself`);
        }
        await this.assertAnotherActiveOwner(actor.companyId, target.id);
      }
      changes.push(`roles → ${newRoles.map((r) => r.name).join(', ')}`);
    }

    if (dto.isActive === false && target.isActive) {
      if (target.id === actor.id) {
        throw new BadRequestException('You cannot deactivate your own account');
      }
      if (target.roles.some((ur) => ur.role.name === OWNER_ROLE)) {
        await this.assertAnotherActiveOwner(actor.companyId, target.id);
      }
      changes.push('deactivated');
    }
    if (dto.isActive === true && !target.isActive) changes.push('reactivated');

    const updated = await this.prisma.$transaction(async (tx) => {
      if (newRoles) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({
          data: newRoles.map((r) => ({ companyId: actor.companyId, userId: id, roleId: r.id, createdById: actor.id })),
        });
      }
      return tx.user.update({
        where: { id },
        data: {
          firstName: dto.firstName?.trim(),
          lastName: dto.lastName?.trim(),
          isActive: dto.isActive,
          // Revoke the refresh session so role changes/deactivation apply within one access-token lifetime
          ...(newRoles || dto.isActive === false ? { refreshToken: null } : {}),
          updatedById: actor.id,
        },
        select: USER_SELECT,
      });
    });

    if (dto.firstName || dto.lastName) changes.push('name updated');
    if (changes.length) {
      await this.audit(actor, 'USER_UPDATED', `${updated.firstName} ${updated.lastName}: ${changes.join('; ')}`);
    }

    return this.present(updated);
  }

  async resetPassword(actor: AuthenticatedUser, id: string) {
    const target = await this.loadManageableUser(actor, id);
    if (target.id === actor.id) {
      throw new BadRequestException('Use "Change password" to change your own password');
    }

    const temporaryPassword = generateTemporaryPassword();
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

    await this.prisma.user.update({
      where: { id },
      data: {
        password: await bcrypt.hash(temporaryPassword, rounds),
        mustChangePassword: true,
        refreshToken: null,
        failedLoginCount: 0,
        lockedUntil: null,
        updatedById: actor.id,
      },
    });

    await this.audit(actor, 'USER_PASSWORD_RESET', `Issued a temporary password to ${target.firstName} ${target.lastName}`);

    return { temporaryPassword };
  }

  private present = (u: any) => ({
    id: u.id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    isActive: u.isActive,
    mustChangePassword: u.mustChangePassword,
    isLocked: !!u.lockedUntil && new Date(u.lockedUntil) > new Date(),
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    roles: u.roles.map((ur: any) => ur.role),
  });

  /** Loads roles in the actor's company and enforces no-escalation rules */
  private async loadAssignableRoles(actor: AuthenticatedUser, roleIds: string[]): Promise<RoleWithPermissions[]> {
    const roles = await this.prisma.role.findMany({
      where: { id: { in: roleIds }, companyId: actor.companyId, deletedAt: null },
      include: { permissions: { include: { permission: { select: { action: true } } } } },
    });
    if (roles.length !== roleIds.length) {
      throw new BadRequestException('One or more selected roles do not exist');
    }

    for (const role of roles) {
      if (role.name === SUPER_ADMIN_ROLE) {
        throw new ForbiddenException(`The ${SUPER_ADMIN_ROLE} role cannot be assigned from the app`);
      }
      if (role.name === OWNER_ROLE && !this.isOwner(actor)) {
        throw new ForbiddenException(`Only a ${OWNER_ROLE} can assign the ${OWNER_ROLE} role`);
      }
      const missing = role.permissions.map((rp) => rp.permission.action).filter((p) => !this.actorHas(actor, p));
      if (missing.length) {
        throw new ForbiddenException(`You cannot assign "${role.name}" because it grants permissions you do not have`);
      }
    }
    return roles;
  }

  /** Loads a user in the actor's company that the actor is allowed to manage */
  private async loadManageableUser(actor: AuthenticatedUser, id: string) {
    const target = await this.prisma.user.findFirst({
      where: { id, companyId: actor.companyId, deletedAt: null },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: { select: { action: true } } } } } } } } },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.id === actor.id) return target;

    const targetRoles = target.roles.map((ur) => ur.role.name);
    if (targetRoles.includes(SUPER_ADMIN_ROLE)) {
      throw new ForbiddenException('Platform administrators cannot be managed from here');
    }
    if (targetRoles.includes(OWNER_ROLE) && !this.isOwner(actor)) {
      throw new ForbiddenException(`Only a ${OWNER_ROLE} can manage another ${OWNER_ROLE}`);
    }
    const targetPermissions = target.roles.flatMap((ur) => ur.role.permissions.map((rp) => rp.permission.action));
    if (targetPermissions.some((p) => !this.actorHas(actor, p))) {
      throw new ForbiddenException('You cannot manage a user who has permissions you do not have');
    }
    return target;
  }

  private async assertAnotherActiveOwner(companyId: string, excludingUserId: string) {
    const others = await this.prisma.user.count({
      where: {
        companyId,
        deletedAt: null,
        isActive: true,
        id: { not: excludingUserId },
        roles: { some: { role: { name: OWNER_ROLE } } },
      },
    });
    if (others === 0) {
      throw new BadRequestException(`The workspace must keep at least one active ${OWNER_ROLE}`);
    }
  }

  private isOwner(actor: AuthenticatedUser) {
    return actor.roles.includes(OWNER_ROLE) || actor.roles.includes(SUPER_ADMIN_ROLE);
  }

  private actorHas(actor: AuthenticatedUser, permission: string) {
    return actor.roles.includes(SUPER_ADMIN_ROLE) || actor.permissions.includes(permission);
  }

  private async audit(actor: AuthenticatedUser, action: string, message: string) {
    await this.prisma.auditLog.create({
      data: { companyId: actor.companyId, userId: actor.id, action, details: JSON.stringify({ message }) },
    });
    this.securityLogger.logSecurityEvent(SecurityEventType.USER_ADMIN_ACTION, {
      userId: actor.id,
      companyId: actor.companyId,
      reason: `${action}: ${message}`,
    });
  }
}
