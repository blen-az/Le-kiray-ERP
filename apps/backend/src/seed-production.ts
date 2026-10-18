import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { DEFAULT_ROLES, PERMISSION_REGISTRY } from './auth/permission-registry';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Le’Kiray ERP Production Database Seeding...');

  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@lekiray.com').trim().toLowerCase();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  const adminName = process.env.INITIAL_ADMIN_NAME || 'System Administrator';
  const companyName = process.env.INITIAL_COMPANY_NAME || 'Le’Kiray Enterprise';

  // 1. Create or Find Initial Company
  let company = await prisma.company.findFirst({
    where: { name: companyName },
  });

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: companyName,
        country: 'Ethiopia',
        currency: 'ETB',
      },
    });
    console.log(`✅ Created Production Company: ${company.name} (${company.id})`);
  }

  // 2. Sync System Permissions (idempotent — safe to re-run on every deploy)
  const dbPermissions = [];
  for (const perm of PERMISSION_REGISTRY) {
    const p = await prisma.permission.upsert({
      where: { companyId_action: { companyId: company.id, action: perm.action } },
      update: { description: perm.description, deletedAt: null },
      create: {
        companyId: company.id,
        action: perm.action,
        description: perm.description,
      },
    });
    dbPermissions.push(p);
  }
  console.log(`✅ Synced ${dbPermissions.length} production permissions.`);

  // 3. Ensure CEO / Owner Role holds every permission (including ones added by later releases)
  let ceoRole = await prisma.role.findFirst({
    where: { companyId: company.id, name: 'CEO / Owner' },
  });

  if (!ceoRole) {
    ceoRole = await prisma.role.create({
      data: {
        companyId: company.id,
        name: 'CEO / Owner',
        description: 'Full system administrator with unrestricted permission access',
      },
    });
    console.log(`✅ Created CEO / Owner role.`);
  }

  const granted = await prisma.rolePermission.createMany({
    data: dbPermissions.map((perm) => ({ roleId: ceoRole!.id, permissionId: perm.id })),
    skipDuplicates: true,
  });
  console.log(`✅ CEO / Owner role verified (${granted.count} new permissions granted).`);
  console.log('ℹ️  Users must sign in again to pick up newly granted permissions.');

  // 3b. Create starter roles that do not exist yet (existing roles are never overwritten)
  const permissionIdByAction = new Map(dbPermissions.map((p) => [p.action, p.id]));
  for (const def of DEFAULT_ROLES) {
    const exists = await prisma.role.findFirst({ where: { companyId: company.id, name: def.name } });
    if (exists) continue;
    await prisma.role.create({
      data: {
        companyId: company.id,
        name: def.name,
        description: def.description,
        permissions: {
          create: def.permissions.map((action) => ({ permissionId: permissionIdByAction.get(action)! })),
        },
      },
    });
    console.log(`✅ Created default role: ${def.name}`);
  }

  // 4. Create Initial Administrator User
  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: adminEmail, mode: 'insensitive' } },
  });

  if (!existingUser) {
    if (!adminPassword || adminPassword === 'ChangeThisPassword123!' || adminPassword.length < 12) {
      throw new Error('INITIAL_ADMIN_PASSWORD must be set to a non-default value of at least 12 characters.');
    }
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const hashedPassword = await bcrypt.hash(adminPassword, rounds);

    const names = adminName.split(' ');
    const firstName = names[0] || 'System';
    const lastName = names.slice(1).join(' ') || 'Admin';

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: adminEmail,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    await prisma.userRole.create({
      data: {
        companyId: company.id,
        userId: user.id,
        roleId: ceoRole.id,
      },
    });

    console.log(`🎉 Initial Production Administrator created successfully!`);
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Company: ${companyName}`);
  } else {
    console.log(`ℹ️ Production Administrator user already exists (${adminEmail}). Skipping creation.`);
  }

  console.log('✨ Production Database Seeding Complete.');
}

main()
  .catch((e) => {
    console.error('❌ Error during production database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
