/**
 * Single source of truth for every permission enforced by @Permissions() guards.
 * Both seed.ts (demo) and seed-production.ts read from here, and audit-rbac.ts
 * verifies every controller permission is listed.
 */
export const PERMISSION_REGISTRY: { action: string; description: string }[] = [
  // Dashboard
  { action: 'dashboard:view', description: 'View the main ERP dashboard' },
  { action: 'settings:view', description: 'View company settings and user management' },

  // Projects & Sites
  { action: 'projects:create', description: 'Create new construction projects' },
  { action: 'projects:view', description: 'View project details and list' },
  { action: 'projects:update', description: 'Edit project details' },
  { action: 'projects:delete', description: 'Delete projects' },
  { action: 'sites:view', description: 'View construction site details' },
  { action: 'sites:create', description: 'Create new construction sites' },
  { action: 'sites:update', description: 'Edit site details' },
  { action: 'sites:delete', description: 'Delete sites' },

  // Machinery
  { action: 'machinery:view', description: 'View fleet machinery list and details' },
  { action: 'machinery:create', description: 'Add new heavy machinery' },
  { action: 'machinery:update', description: 'Edit machinery details' },
  { action: 'machinery:delete', description: 'Delete machinery records' },
  { action: 'machinery:assign', description: 'Assign machinery to project sites' },
  { action: 'machinery:return', description: 'Return/cancel machinery assignments' },
  { action: 'machinery:history', description: 'View machinery event history and timeline' },

  // Fuel
  { action: 'fuel:view', description: 'View fuel requests and logs' },
  { action: 'fuel:request', description: 'Submit fuel replenishment requests' },
  { action: 'fuel:approve', description: 'Approve fuel requests' },
  { action: 'fuel:reject', description: 'Reject fuel requests' },
  { action: 'fuel:issue', description: 'Issue fuel against approved requests' },
  { action: 'fuel:update', description: 'Update fuel requests or logs' },
  { action: 'fuel:log', description: 'Record manual fuel logs' },
  { action: 'fuel:delete', description: 'Delete fuel requests or logs' },
  { action: 'fuel:reports', description: 'View fuel consumption reports' },

  // Inventory
  { action: 'inventory:view', description: 'View inventory directory, balances, and warehouses' },
  { action: 'inventory:create', description: 'Register inventory items and warehouses' },
  { action: 'inventory:update', description: 'Edit inventory item details and stores' },
  { action: 'inventory:delete', description: 'Delete inventory items or warehouses' },
  { action: 'inventory:stock_in', description: 'Record warehouse item check-ins' },
  { action: 'inventory:stock_out', description: 'Record material dispatch to site' },
  { action: 'inventory:transfer', description: 'Transfer materials between warehouses/site stores' },
  { action: 'inventory:adjust', description: 'Adjust inventory stock balances' },
  { action: 'inventory:request', description: 'Submit material requests' },
  { action: 'inventory:approve', description: 'Approve material requests' },
  { action: 'inventory:reject', description: 'Reject material requests' },
  { action: 'inventory:issue', description: 'Issue approved material requests' },
  { action: 'inventory:reports', description: 'View inventory reports and analytics' },

  // HR & Attendance
  { action: 'hr:view', description: 'View employees, rosters, and HR profiles' },
  { action: 'hr:create', description: 'Create employee records' },
  { action: 'hr:update', description: 'Update employee records' },
  { action: 'hr:delete', description: 'Delete employee records' },
  { action: 'hr:assign', description: 'Assign employees to project sites' },
  { action: 'hr:reports', description: 'View HR & workforce analytics reports' },
  { action: 'attendance:view', description: 'View daily attendance registers' },
  { action: 'attendance:create', description: 'Record daily attendance and overtime' },
  { action: 'attendance:update', description: 'Update attendance records' },
  { action: 'attendance:delete', description: 'Delete attendance records' },
  { action: 'leave:view', description: 'View employee leave requests' },
  { action: 'leave:create', description: 'Submit leave requests' },
  { action: 'leave:approve', description: 'Approve employee leave requests' },
  { action: 'leave:reject', description: 'Reject employee leave requests' },
  { action: 'leave:delete', description: 'Delete leave requests' },

  // Daily Site Reports
  { action: 'reports:view', description: 'View daily site logs' },
  { action: 'reports:create', description: 'Create daily site reports' },
  { action: 'reports:update', description: 'Edit daily site reports' },
  { action: 'reports:delete', description: 'Delete daily site reports' },
  { action: 'reports:submit', description: 'Submit daily site reports' },
  { action: 'reports:approve', description: 'Approve daily site reports' },
  { action: 'reports:reject', description: 'Reject daily site reports' },
  { action: 'reports:export', description: 'Export daily site logs' },

  // Maintenance
  { action: 'maintenance:view', description: 'View machinery maintenance records' },
  { action: 'maintenance:create', description: 'Create machinery maintenance logs' },
  { action: 'maintenance:update', description: 'Edit machinery maintenance logs' },
  { action: 'maintenance:delete', description: 'Delete machinery maintenance records' },
  { action: 'maintenance:start', description: 'Start machinery maintenance repair work' },
  { action: 'maintenance:complete', description: 'Complete machinery maintenance & issue parts' },
  { action: 'maintenance:cancel', description: 'Cancel machinery maintenance records' },
  { action: 'maintenance:reports', description: 'View machinery maintenance & downtime reports' },

  // Finance
  { action: 'finance:view', description: 'View financial summary, expenses, & project costs' },
  { action: 'finance:create', description: 'Record manual operational expenses & revenues' },
  { action: 'finance:update', description: 'Edit manual expense records' },
  { action: 'finance:delete', description: 'Delete manual expense records' },
  { action: 'finance:approve', description: 'Approve or reject manual operational expenses' },
  { action: 'finance:reports', description: 'View financial & cost analytics reports' },
  { action: 'finance:profitability', description: 'View project profitability & gross margin estimates' },

  // Tenders & Bids
  { action: 'tenders:view', description: 'View tender pipeline, bid deadlines, and outcomes' },
  { action: 'tenders:create', description: 'Register new tenders and bid opportunities' },
  { action: 'tenders:update', description: 'Edit tenders, bid checklists, and pipeline stage' },
  { action: 'tenders:delete', description: 'Delete tender records' },
  { action: 'tenders:award', description: 'Record tender win/loss and convert awarded tenders to projects' },
];
