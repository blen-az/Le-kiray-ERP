import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { provisionCompanyAccess } from './platform/tenant-provisioning';

const prisma = new PrismaClient();

/**
 * Production bootstrap — runs on every deploy (see render.yaml) and is idempotent:
 * 1. Creates the operator's own company + first admin on an empty database
 * 2. Syncs permissions and starter roles for EVERY company, so new modules work for all tenants
 * 3. Sets the platform-admin flag from PLATFORM_ADMIN_EMAILS (defaults to INITIAL_ADMIN_EMAIL)
 */
async function main() {
  console.log('🌱 Starting Le’Kiray ERP Production Database Seeding...');

  const adminEmail = (process.env.INITIAL_ADMIN_EMAIL || 'admin@lekiray.com').trim().toLowerCase();
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD;
  const adminName = process.env.INITIAL_ADMIN_NAME || 'System Administrator';
  const companyName = process.env.INITIAL_COMPANY_NAME || 'Le’Kiray Enterprise';

  // 1. Operator company + first administrator (only when that admin does not exist yet)
  const existingAdmin = await prisma.user.findFirst({
    where: { email: { equals: adminEmail, mode: 'insensitive' } },
  });

  const companyCount = await prisma.company.count({ where: { deletedAt: null } });

  if (!existingAdmin && companyCount > 0) {
    // Bootstrap is only for an empty database; never block a deploy over a missing/renamed admin env var
    console.log(`ℹ️  ${adminEmail} not found but companies already exist — skipping initial admin bootstrap.`);
  } else if (!existingAdmin) {
    if (!adminPassword || adminPassword === 'ChangeThisPassword123!' || adminPassword.length < 12) {
      throw new Error('INITIAL_ADMIN_PASSWORD must be set to a non-default value of at least 12 characters.');
    }

    let company = await prisma.company.findFirst({ where: { name: companyName, deletedAt: null } });
    if (!company) {
      company = await prisma.company.create({
        data: { name: companyName, country: 'Ethiopia', currency: 'ETB' },
      });
      console.log(`✅ Created company: ${company.name} (${company.id})`);
    }

    const { ownerRoleId } = await provisionCompanyAccess(prisma, company.id);

    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const names = adminName.split(' ');
    await prisma.user.create({
      data: {
        companyId: company.id,
        email: adminEmail,
        password: await bcrypt.hash(adminPassword, rounds),
        firstName: names[0] || 'System',
        lastName: names.slice(1).join(' ') || 'Admin',
        roles: { create: { companyId: company.id, roleId: ownerRoleId } },
      },
    });

    console.log(`🎉 Initial administrator created: ${adminEmail} (${company.name})`);
  } else {
    console.log(`ℹ️  Administrator ${adminEmail} already exists. Skipping creation.`);
  }

  // 2. Bring every company's permissions and starter roles up to date
  const companies = await prisma.company.findMany({ where: { deletedAt: null }, select: { id: true, name: true } });
  for (const company of companies) {
    const result = await provisionCompanyAccess(prisma, company.id);
    const changes = [
      result.newOwnerGrants ? `${result.newOwnerGrants} new owner permissions` : null,
      result.createdRoles.length ? `roles added: ${result.createdRoles.join(', ')}` : null,
    ].filter(Boolean);
    console.log(`✅ ${company.name}: ${result.permissionCount} permissions${changes.length ? ` — ${changes.join('; ')}` : ' — up to date'}`);
  }
  console.log('ℹ️  Users must sign in again to pick up newly granted permissions.');

  // 3. Platform administrators (Le’Kiray operators) — env is the source of truth
  const platformAdmins = (process.env.PLATFORM_ADMIN_EMAILS || adminEmail)
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  const promoted = await prisma.user.updateMany({
    where: { OR: platformAdmins.map((email) => ({ email: { equals: email, mode: 'insensitive' as const } })), isPlatformAdmin: false },
    data: { isPlatformAdmin: true },
  });
  const demoted = await prisma.user.updateMany({
    where: {
      isPlatformAdmin: true,
      NOT: { OR: platformAdmins.map((email) => ({ email: { equals: email, mode: 'insensitive' as const } })) },
    },
    data: { isPlatformAdmin: false, refreshToken: null },
  });
  console.log(`✅ Platform admins: ${platformAdmins.join(', ')} (${promoted.count} promoted, ${demoted.count} removed)`);

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
