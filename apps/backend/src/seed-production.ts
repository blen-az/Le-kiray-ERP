import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Le’Kiray ERP Production Database Seeding...');

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@lekiray.com';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'ChangeThisPassword123!';
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

  // 2. Base System Permissions
  const permissionsList = [
    { action: 'projects:view', description: 'View projects' },
    { action: 'projects:create', description: 'Create projects' },
    { action: 'projects:edit', description: 'Edit projects' },
    { action: 'projects:delete', description: 'Delete projects' },
    { action: 'sites:view', description: 'View sites' },
    { action: 'sites:create', description: 'Create sites' },
    { action: 'sites:edit', description: 'Edit sites' },
    { action: 'sites:delete', description: 'Delete sites' },
    { action: 'machinery:view', description: 'View machinery' },
    { action: 'machinery:create', description: 'Create machinery' },
    { action: 'machinery:edit', description: 'Edit machinery' },
    { action: 'machinery:delete', description: 'Delete machinery' },
    { action: 'machinery:assign', description: 'Assign machinery to sites' },
    { action: 'fuel:request', description: 'Request fuel' },
    { action: 'fuel:approve', description: 'Approve fuel requests' },
    { action: 'fuel:issue', description: 'Issue fuel' },
    { action: 'fuel:view', description: 'View fuel logs' },
    { action: 'inventory:view', description: 'View inventory' },
    { action: 'inventory:manage', description: 'Manage inventory' },
    { action: 'inventory:request', description: 'Request inventory items' },
    { action: 'inventory:approve', description: 'Approve inventory requests' },
    { action: 'inventory:issue', description: 'Issue inventory items' },
    { action: 'hr:view', description: 'View HR records' },
    { action: 'hr:manage', description: 'Manage HR records' },
    { action: 'hr:attendance', description: 'Record attendance' },
    { action: 'hr:leave_approve', description: 'Approve leave requests' },
    { action: 'reports:create', description: 'Create daily reports' },
    { action: 'reports:submit', description: 'Submit daily reports' },
    { action: 'reports:approve', description: 'Approve daily reports' },
    { action: 'reports:view', description: 'View daily reports' },
    { action: 'maintenance:view', description: 'View maintenance' },
    { action: 'maintenance:create', description: 'Create maintenance' },
    { action: 'maintenance:manage', description: 'Manage maintenance' },
    { action: 'finance:view', description: 'View finance' },
    { action: 'finance:manage', description: 'Manage expenses and revenues' },
    { action: 'finance:approve', description: 'Approve expenses' },
    { action: 'dashboard:view', description: 'View dashboard' },
    { action: 'settings:manage', description: 'Manage company settings and users' },
  ];

  const dbPermissions = [];
  for (const perm of permissionsList) {
    let p = await prisma.permission.findFirst({
      where: { companyId: company.id, action: perm.action },
    });
    if (!p) {
      p = await prisma.permission.create({
        data: {
          companyId: company.id,
          action: perm.action,
          description: perm.description,
        },
      });
    }
    dbPermissions.push(p);
  }
  console.log(`✅ Verified ${dbPermissions.length} production permissions.`);

  // 3. Create CEO / Owner Role with all permissions
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

    for (const perm of dbPermissions) {
      await prisma.rolePermission.create({
        data: {
          roleId: ceoRole.id,
          permissionId: perm.id,
        },
      });
    }
    console.log(`✅ Created CEO / Owner role with all permissions.`);
  }

  // 4. Create Initial Administrator User
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingUser) {
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
