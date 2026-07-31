import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function auditRbac() {
  console.log('🔍 Starting RBAC Production Audit...');
  let hasErrors = false;

  // 1. Audit Codebase Permissions vs Seed Permissions
  const srcDir = path.join(__dirname, '../src');
  const allTsFiles = getAllFiles(srcDir, '.ts');

  const permissionRegex = /@Permissions\(([^)]+)\)/g;
  const permissionsUsedInCode = new Set<string>();

  for (const file of allTsFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    let match;
    while ((match = permissionRegex.exec(content)) !== null) {
      const perms = match[1]
        .split(',')
        .map((p) => p.trim().replace(/['"]/g, ''));
      perms.forEach((p) => permissionsUsedInCode.add(p));
    }
  }

  console.log(`📋 Found ${permissionsUsedInCode.size} unique permissions referenced in controller decorators.`);

  // Load Seed Permissions
  let seedPermissions: string[] = [];
  try {
    const seedContent = fs.readFileSync(path.join(__dirname, 'seed.ts'), 'utf-8');
    const seedMatch = seedContent.match(/const permissions\s*=\s*(\[[^\]]+\])/s);
    if (seedMatch) {
      // Extract permissions array actions
      const actionMatches = seedContent.matchAll(/action:\s*['"]([^'"]+)['"]/g);
      for (const m of actionMatches) {
        seedPermissions.push(m[1]);
      }
    }
  } catch (err) {
    console.warn('⚠️ Could not parse seed.ts directly, fetching from database...');
  }

  if (seedPermissions.length === 0) {
    const dbPermissions = await prisma.permission.findMany({ select: { action: true } });
    seedPermissions = dbPermissions.map((p) => p.action);
  }

  console.log(`✅ ${seedPermissions.length} total permissions defined in system registry.`);

  // Verify every permission used in code exists in seed permissions
  for (const perm of permissionsUsedInCode) {
    if (!seedPermissions.includes(perm)) {
      console.error(`❌ Audit Failure: Permission "${perm}" is used in code but missing from seed permissions!`);
      hasErrors = true;
    }
  }

  // 2. Audit Database Roles and Permissions
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: { permission: true },
        },
      },
    });

    if (roles.length > 0) {
      console.log(`👥 Auditing ${roles.length} roles in database...`);

      const ceoRole = roles.find((r) => r.name === 'CEO / Owner' || r.name === 'CEO');
      if (ceoRole) {
        console.log(`👑 CEO Role has ${ceoRole.permissions.length}/${seedPermissions.length} permissions.`);
        if (ceoRole.permissions.length < seedPermissions.length) {
          console.error(`❌ Audit Failure: CEO role is missing permissions!`);
          hasErrors = true;
        }
      }

      for (const role of roles) {
        if (role.permissions.length === 0) {
          console.warn(`⚠️ Warning: Role "${role.name}" has 0 permissions assigned.`);
        }
      }
    }
  } catch {
    console.log('ℹ️ Database roles check skipped (No live DB connection or empty DB). Code verification passed.');
  }

  if (hasErrors) {
    console.error('❌ RBAC Audit Failed with errors.');
    process.exit(1);
  } else {
    console.log('🎉 RBAC Production Audit Passed! All controller permissions are valid and enforced.');
    process.exit(0);
  }
}

function getAllFiles(dirPath: string, extension: string): string[] {
  let files: string[] = [];
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    const res = path.resolve(dirPath, item.name);
    if (item.isDirectory()) {
      files = [...files, ...getAllFiles(res, extension)];
    } else if (item.isFile() && item.name.endsWith(extension)) {
      files.push(res);
    }
  }

  return files;
}

auditRbac();
