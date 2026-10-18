import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../auth/current-user.decorator';
import { LOCKED_ROLES, PERMISSION_REGISTRY, SUPER_ADMIN_ROLE } from '../auth/permission-registry';
import { CreateRoleDto, UpdateRoleDto } from './dto/users.dto';

const KNOWN_PERMISSIONS = new Map(PERMISSION_REGISTRY.map((p) => [p.action, p.description]));

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  /** Permission catalogue grouped by module, for the role editor */
  listPermissions() {
    const groups = new Map<string, { action: string; description: string }[]>();
    for (const p of PERMISSION_REGISTRY) {
      const module = p.action.split(':')[0];
      if (!groups.has(module)) groups.set(module, []);
      groups.get(module)!.push(p);
    }
    return Array.from(groups, ([module, permissions]) => ({ module, permissions }));
  }

  async findAll(companyId: string) {
    const roles = await this.prisma.role.findMany({
      where: { companyId, deletedAt: null, name: { not: SUPER_ADMIN_ROLE } },
      include: {
        permissions: { include: { permission: { select: { action: true } } } },
        _count: { select: { users: { where: { user: { deletedAt: null } } } } },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      locked: LOCKED_ROLES.includes(r.name),
      userCount: r._count.users,
      permissions: r.permissions.map((rp) => rp.permission.action).sort(),
    }));
  }

  async create(actor: AuthenticatedUser, dto: CreateRoleDto) {
    const name = dto.name.trim();
    this.assertNameAllowed(name);
    await this.assertNameFree(actor.companyId, name);
    const permissionIds = await this.resolvePermissions(actor, dto.permissions);

    const role = await this.prisma.role.create({
      data: {
        companyId: actor.companyId,
        name,
        description: dto.description?.trim() || null,
        createdById: actor.id,
        permissions: { create: permissionIds.map((permissionId) => ({ permissionId })) },
      },
    });

    await this.audit(actor, 'ROLE_CREATED', `Created role "${role.name}" with ${permissionIds.length} permissions`);
    return this.findOne(actor.companyId, role.id);
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateRoleDto) {
    const role = await this.getEditableRole(actor.companyId, id);

    let name: string | undefined;
    if (dto.name !== undefined && dto.name.trim() !== role.name) {
      name = dto.name.trim();
      this.assertNameAllowed(name);
      await this.assertNameFree(actor.companyId, name, id);
    }

    const permissionIds = dto.permissions ? await this.resolvePermissions(actor, dto.permissions) : undefined;

    await this.prisma.$transaction(async (tx) => {
      if (permissionIds) {
        await tx.rolePermission.deleteMany({ where: { roleId: id } });
        await tx.rolePermission.createMany({ data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })) });
        // Holders of this role get the new permissions on their next refresh (within 15 minutes)
        await tx.user.updateMany({
          where: { roles: { some: { roleId: id } } },
          data: { refreshToken: null },
        });
      }
      await tx.role.update({
        where: { id },
        data: {
          name,
          description: dto.description === undefined ? undefined : dto.description.trim() || null,
          updatedById: actor.id,
        },
      });
    });

    await this.audit(
      actor,
      'ROLE_UPDATED',
      `Updated role "${name ?? role.name}"${permissionIds ? ` (${permissionIds.length} permissions)` : ''}`,
    );
    return this.findOne(actor.companyId, id);
  }

  async delete(actor: AuthenticatedUser, id: string) {
    const role = await this.getEditableRole(actor.companyId, id);
    const holders = await this.prisma.userRole.count({ where: { roleId: id, user: { deletedAt: null } } });
    if (holders > 0) {
      throw new BadRequestException(`"${role.name}" is assigned to ${holders} user(s). Reassign them before deleting it.`);
    }

    await this.prisma.role.delete({ where: { id } });
    await this.audit(actor, 'ROLE_DELETED', `Deleted role "${role.name}"`);
    return { success: true };
  }

  private async findOne(companyId: string, id: string) {
    const roles = await this.findAll(companyId);
    return roles.find((r) => r.id === id);
  }

  private async getEditableRole(companyId: string, id: string) {
    const role = await this.prisma.role.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (LOCKED_ROLES.includes(role.name)) {
      throw new ForbiddenException(`The "${role.name}" role is managed by the system and cannot be changed`);
    }
    return role;
  }

  private assertNameAllowed(name: string) {
    if (LOCKED_ROLES.some((r) => r.toLowerCase() === name.toLowerCase())) {
      throw new BadRequestException(`"${name}" is a reserved role name`);
    }
  }

  private async assertNameFree(companyId: string, name: string, excludeId?: string) {
    const clash = await this.prisma.role.findFirst({
      where: { companyId, name: { equals: name, mode: 'insensitive' }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    if (clash) {
      throw new ConflictException(`A role named "${clash.name}" already exists`);
    }
  }

  /** Validates actions against the registry, blocks escalation, and returns permission row IDs */
  private async resolvePermissions(actor: AuthenticatedUser, actions: string[]) {
    const unknown = actions.filter((a) => !KNOWN_PERMISSIONS.has(a));
    if (unknown.length) {
      throw new BadRequestException(`Unknown permissions: ${unknown.join(', ')}`);
    }
    const isSuperAdmin = actor.roles.includes(SUPER_ADMIN_ROLE);
    const notHeld = actions.filter((a) => !isSuperAdmin && !actor.permissions.includes(a));
    if (notHeld.length) {
      throw new ForbiddenException(`You cannot grant permissions you do not have: ${notHeld.join(', ')}`);
    }

    const ids: string[] = [];
    for (const action of actions) {
      const permission = await this.prisma.permission.upsert({
        where: { companyId_action: { companyId: actor.companyId, action } },
        update: {},
        create: { companyId: actor.companyId, action, description: KNOWN_PERMISSIONS.get(action) },
      });
      ids.push(permission.id);
    }
    return ids;
  }

  private async audit(actor: AuthenticatedUser, action: string, message: string) {
    await this.prisma.auditLog.create({
      data: { companyId: actor.companyId, userId: actor.id, action, details: JSON.stringify({ message }) },
    });
  }
}
