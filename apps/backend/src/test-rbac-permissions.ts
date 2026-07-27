import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './auth/permissions.guard';

import { ProjectsController } from './projects/projects.controller';
import { MachineryController } from './machinery/machinery.controller';
import { FuelController } from './fuel/fuel.controller';
import { InventoryController } from './inventory/inventory.controller';
import { HrController } from './hr/hr.controller';
import { ReportsController } from './reports/reports.controller';
import { MaintenanceController } from './maintenance/maintenance.controller';
import { FinanceController } from './finance/finance.controller';
import { DashboardController } from './dashboard/dashboard.controller';

// Define permissions map per role (matching seed.ts)
const ROLE_USER_MAP: Record<string, { roles: string[]; permissions: string[] }> = {
  'CEO / Owner': {
    roles: ['CEO / Owner'],
    permissions: ['all'],
  },
  'Project Manager': {
    roles: ['Project Manager'],
    permissions: [
      'dashboard:view', 'projects:view', 'projects:create', 'projects:update',
      'sites:view', 'sites:create', 'sites:update', 'machinery:view',
      'fuel:view', 'inventory:view', 'hr:view', 'hr:reports', 'attendance:view',
      'reports:view', 'reports:create', 'reports:update', 'reports:submit', 'reports:approve', 'reports:reject',
      'maintenance:view', 'finance:view', 'finance:reports',
    ],
  },
  'Fleet Manager': {
    roles: ['Fleet Manager'],
    permissions: [
      'dashboard:view', 'projects:view', 'sites:view',
      'machinery:view', 'machinery:create', 'machinery:update', 'machinery:assign', 'machinery:return', 'machinery:history',
      'fuel:view', 'fuel:approve', 'fuel:reject', 'fuel:issue', 'fuel:reports',
      'maintenance:view', 'maintenance:create', 'maintenance:update', 'maintenance:start', 'maintenance:complete', 'maintenance:cancel', 'maintenance:reports',
      'inventory:view', 'hr:view',
    ],
  },
  'Inventory Manager': {
    roles: ['Inventory Manager'],
    permissions: [
      'dashboard:view', 'projects:view', 'sites:view',
      'inventory:view', 'inventory:create', 'inventory:update',
      'inventory:stock_in', 'inventory:stock_out', 'inventory:transfer', 'inventory:adjust',
      'inventory:request', 'inventory:approve', 'inventory:reject', 'inventory:issue', 'inventory:reports',
      'fuel:view', 'maintenance:view', 'reports:view',
    ],
  },
  'HR Manager': {
    roles: ['HR Manager'],
    permissions: [
      'dashboard:view', 'projects:view', 'sites:view',
      'hr:view', 'hr:create', 'hr:update', 'hr:assign', 'hr:reports',
      'attendance:view', 'attendance:create', 'attendance:update',
      'leave:view', 'leave:create', 'leave:approve', 'leave:reject',
      'reports:view', 'machinery:view', 'fuel:view',
    ],
  },
  'Finance Officer': {
    roles: ['Finance Officer'],
    permissions: [
      'dashboard:view', 'projects:view', 'sites:view',
      'fuel:view', 'fuel:reports', 'inventory:view', 'inventory:reports',
      'maintenance:view', 'maintenance:reports', 'hr:view', 'hr:reports',
      'reports:view', 'finance:view', 'finance:create', 'finance:update', 'finance:delete',
      'finance:approve', 'finance:reports', 'finance:profitability',
    ],
  },
  'Site Manager': {
    roles: ['Site Manager'],
    permissions: [
      'dashboard:view', 'projects:view', 'sites:view',
      'machinery:view', 'fuel:view', 'fuel:request',
      'inventory:view', 'inventory:request', 'hr:view',
      'attendance:view', 'attendance:create',
      'reports:view', 'reports:create', 'reports:update', 'reports:submit',
      'maintenance:view', 'maintenance:create',
    ],
  },
};

function createMockContext(user: any, targetClass: any, handler: any): any {
  return {
    getHandler: () => handler,
    getClass: () => targetClass,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  };
}

async function runRbacTests() {
  console.log('🧪 Starting RBAC Permission Enforcement Audit Suite...\n');

  const reflector = new Reflector();
  const guard = new PermissionsGuard(reflector);

  const testCases = [
    {
      role: 'Project Manager',
      controller: FuelController,
      methodName: 'approveRequest',
      description: 'Project Manager cannot approve fuel',
    },
    {
      role: 'Fleet Manager',
      controller: HrController,
      methodName: 'createEmployee',
      description: 'Fleet Manager cannot create employee',
    },
    {
      role: 'Inventory Manager',
      controller: HrController,
      methodName: 'approveLeaveRequest',
      description: 'Inventory Manager cannot approve leave',
    },
    {
      role: 'HR Manager',
      controller: InventoryController,
      methodName: 'issueRequest',
      description: 'HR Manager cannot issue inventory stock',
    },
    {
      role: 'Finance Officer',
      controller: MachineryController,
      methodName: 'assign',
      description: 'Finance Officer cannot assign machinery',
    },
    {
      role: 'Site Manager',
      controller: FinanceController,
      methodName: 'getProjectProfitability',
      description: 'Site Manager cannot view finance profitability',
    },
    {
      role: 'Site Manager',
      controller: ReportsController,
      methodName: 'approveReport',
      description: 'Site Manager cannot approve daily reports',
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const user = ROLE_USER_MAP[tc.role];
    const handler = (tc.controller.prototype as any)[tc.methodName];

    if (!handler) {
      console.error(`❌ Handler ${tc.methodName} not found on ${tc.controller.name}`);
      failed++;
      continue;
    }

    const context = createMockContext(user, tc.controller, handler);
    const allowed = guard.canActivate(context);

    // We expect access to be BLOCKED (canActivate === false)
    if (allowed === false) {
      console.log(`✅ PASSED: ${tc.description} (403 Forbidden Blocked)`);
      passed++;
    } else {
      console.error(`❌ FAILED: ${tc.description} (Access was ALLOWED instead of 403)`);
      failed++;
    }
  }

  console.log(`\n========================================`);
  console.log(`RBAC Permission Test Summary: ${passed}/${testCases.length} Passed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runRbacTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
