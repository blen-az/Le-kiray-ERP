import { Prisma } from '@prisma/client';
import { DEFAULT_ROLES, OWNER_ROLE, PERMISSION_REGISTRY } from '../auth/permission-registry';

export interface ProvisionResult {
  ownerRoleId: string;
  permissionCount: number;
  newOwnerGrants: number;
  createdRoles: string[];
}

/**
 * Brings one company's access model up to date with the code:
 * - every permission in PERMISSION_REGISTRY exists for the company
 * - the CEO / Owner role exists and holds all of them
 * - starter roles exist (existing roles are never modified, so company customisations survive)
 *
 * Idempotent. Used when onboarding a company and on every deploy (seed-production).
 */
export async function provisionCompanyAccess(db: Prisma.TransactionClient, companyId: string): Promise<ProvisionResult> {
  const actions = PERMISSION_REGISTRY.map((p) => p.action);

  await db.permission.createMany({
    data: PERMISSION_REGISTRY.map((p) => ({ companyId, action: p.action, description: p.description })),
    skipDuplicates: true,
  });
  await db.permission.updateMany({
    where: { companyId, action: { in: actions }, deletedAt: { not: null } },
    data: { deletedAt: null },
  });
  const permissions = await db.permission.findMany({
    where: { companyId, action: { in: actions } },
    select: { id: true, action: true },
  });
  const permissionIdByAction = new Map(permissions.map((p) => [p.action, p.id]));

  let ownerRole = await db.role.findFirst({ where: { companyId, name: OWNER_ROLE } });
  if (!ownerRole) {
    ownerRole = await db.role.create({
      data: {
        companyId,
        name: OWNER_ROLE,
        description: 'Company owner with access to every module and setting',
      },
    });
  }
  const granted = await db.rolePermission.createMany({
    data: permissions.map((p) => ({ roleId: ownerRole!.id, permissionId: p.id })),
    skipDuplicates: true,
  });

  const createdRoles: string[] = [];
  for (const def of DEFAULT_ROLES) {
    const exists = await db.role.findFirst({ where: { companyId, name: def.name } });
    if (exists) continue;
    await db.role.create({
      data: {
        companyId,
        name: def.name,
        description: def.description,
        permissions: {
          create: def.permissions.map((action) => ({ permissionId: permissionIdByAction.get(action)! })),
        },
      },
    });
    createdRoles.push(def.name);
  }

  return {
    ownerRoleId: ownerRole.id,
    permissionCount: permissions.length,
    newOwnerGrants: granted.count,
    createdRoles,
  };
}
