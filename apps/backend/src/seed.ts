import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing data (safely in order of dependencies)
  await prisma.auditLog.deleteMany({});
  await prisma.maintenanceRecord.deleteMany({});
  await prisma.dailyReport.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.fuelLog.deleteMany({});
  await prisma.fuelRequest.deleteMany({});
  await prisma.machineAssignment.deleteMany({});
  await prisma.machine.deleteMany({});
  await prisma.site.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.company.deleteMany({});

  console.log('🧹 Database cleaned.');

  // 2. Create Company
  const company = await prisma.company.create({
    data: {
      name: 'ABC Construction PLC',
      country: 'Ethiopia',
      currency: 'ETB',
    },
  });
  console.log(`🏢 Created company: ${company.name} (${company.id})`);

  // 3. Create Permissions
  const permissionActions = [
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
  ];

  const permissions: Record<string, any> = {};
  for (const perm of permissionActions) {
    permissions[perm.action] = await prisma.permission.create({
      data: {
        companyId: company.id,
        action: perm.action,
        description: perm.description,
      },
    });
  }
  console.log(`🔑 Seeded ${permissionActions.length} permissions.`);

  // 4. Create Roles
  const rolesToCreate = [
    { name: 'Super Admin', desc: 'Global platform super-admin access' },
    { name: 'CEO / Owner', desc: 'Contractor company owner/CEO with read/write access to all dashboards' },
    { name: 'Company Admin', desc: 'Administrator of contractor workspace' },
    { name: 'Project Manager', desc: 'Manages assigned projects and sites' },
    { name: 'HR Manager', desc: 'Manages employee records, rosters, and attendance' },
    { name: 'Inventory Manager', desc: 'Manages warehouses, materials, and stock movement' },
    { name: 'Fleet Manager', desc: 'Manages heavy machinery status, operator assignments, and fuel logs' },
    { name: 'Finance Officer', desc: 'Manages operational expenses, financial reports, and project cost analysis' },
    { name: 'Site Manager', desc: 'Submits daily site reports and requests materials/fuel' },
    { name: 'Machine Operator', desc: 'Uses heavy machinery and logs working hours' },
    { name: 'Viewer', desc: 'Read-only access to specific dashboards' },
  ];

  const roles: Record<string, any> = {};
  for (const r of rolesToCreate) {
    roles[r.name] = await prisma.role.create({
      data: {
        companyId: company.id,
        name: r.name,
        description: r.desc,
      },
    });
  }
  console.log(`🎭 Seeded ${rolesToCreate.length} workspace roles.`);

  // 5. Connect Permissions to Roles
  const rolePermissionsData: { roleId: string; permissionId: string }[] = [];

  // CEO / Owner — all permissions
  for (const act of permissionActions) {
    rolePermissionsData.push({
      roleId: roles['CEO / Owner'].id,
      permissionId: permissions[act.action].id,
    });
  }

  // Project Manager permissions
  const pmPerms = [
    'dashboard:view',
    'projects:view', 'projects:create', 'projects:update',
    'sites:view', 'sites:create', 'sites:update',
    'machinery:view',
    'fuel:view',
    'inventory:view',
    'hr:view', 'hr:reports',
    'attendance:view',
    'reports:view', 'reports:create', 'reports:update', 'reports:submit', 'reports:approve', 'reports:reject',
    'maintenance:view',
    'finance:view', 'finance:reports',
  ];
  for (const p of pmPerms) {
    rolePermissionsData.push({ roleId: roles['Project Manager'].id, permissionId: permissions[p].id });
  }

  // Fleet Manager permissions
  const fleetPerms = [
    'dashboard:view',
    'projects:view', 'sites:view',
    'machinery:view', 'machinery:create', 'machinery:update', 'machinery:assign', 'machinery:return', 'machinery:history',
    'fuel:view', 'fuel:approve', 'fuel:reject', 'fuel:issue', 'fuel:reports',
    'maintenance:view', 'maintenance:create', 'maintenance:update', 'maintenance:start', 'maintenance:complete', 'maintenance:cancel', 'maintenance:reports',
    'inventory:view',
    'hr:view',
  ];
  for (const p of fleetPerms) {
    rolePermissionsData.push({ roleId: roles['Fleet Manager'].id, permissionId: permissions[p].id });
  }

  // Inventory Manager permissions
  const invPerms = [
    'dashboard:view',
    'projects:view', 'sites:view',
    'inventory:view', 'inventory:create', 'inventory:update',
    'inventory:stock_in', 'inventory:stock_out', 'inventory:transfer', 'inventory:adjust',
    'inventory:request', 'inventory:approve', 'inventory:reject', 'inventory:issue', 'inventory:reports',
    'fuel:view',
    'maintenance:view',
    'reports:view',
  ];
  for (const p of invPerms) {
    rolePermissionsData.push({ roleId: roles['Inventory Manager'].id, permissionId: permissions[p].id });
  }

  // HR Manager permissions
  const hrPerms = [
    'dashboard:view',
    'projects:view', 'sites:view',
    'hr:view', 'hr:create', 'hr:update', 'hr:assign', 'hr:reports',
    'attendance:view', 'attendance:create', 'attendance:update',
    'leave:view', 'leave:create', 'leave:approve', 'leave:reject',
    'reports:view',
    'machinery:view',
    'fuel:view',
  ];
  for (const p of hrPerms) {
    rolePermissionsData.push({ roleId: roles['HR Manager'].id, permissionId: permissions[p].id });
  }

  // Finance Officer permissions
  const financePerms = [
    'dashboard:view',
    'projects:view', 'sites:view',
    'fuel:view', 'fuel:reports',
    'inventory:view', 'inventory:reports',
    'maintenance:view', 'maintenance:reports',
    'hr:view', 'hr:reports',
    'reports:view',
    'finance:view', 'finance:create', 'finance:update', 'finance:delete',
    'finance:approve', 'finance:reports', 'finance:profitability',
  ];
  for (const p of financePerms) {
    rolePermissionsData.push({ roleId: roles['Finance Officer'].id, permissionId: permissions[p].id });
  }

  // Site Manager permissions
  const sitePerms = [
    'dashboard:view',
    'projects:view', 'sites:view',
    'machinery:view',
    'fuel:view', 'fuel:request',
    'inventory:view', 'inventory:request',
    'hr:view',
    'attendance:view', 'attendance:create',
    'reports:view', 'reports:create', 'reports:update', 'reports:submit',
    'maintenance:view', 'maintenance:create',
  ];
  for (const p of sitePerms) {
    rolePermissionsData.push({ roleId: roles['Site Manager'].id, permissionId: permissions[p].id });
  }

  await prisma.rolePermission.createMany({ data: rolePermissionsData });

  console.log('🔗 Role-Permission mappings established.');

  // 6. Create Users
  const usersToSeed = [
    { email: 'ceo@abcconstruction.com', firstName: 'Kidus', lastName: 'Getachew', roleName: 'CEO / Owner' },
    { email: 'pm@abcconstruction.com', firstName: 'Mulugeta', lastName: 'Assefa', roleName: 'Project Manager' },
    { email: 'hr@abcconstruction.com', firstName: 'Hana', lastName: 'Tekle', roleName: 'HR Manager' },
    { email: 'inventory@abcconstruction.com', firstName: 'Yonas', lastName: 'Bekele', roleName: 'Inventory Manager' },
    { email: 'fleet@abcconstruction.com', firstName: 'Daniel', lastName: 'Solomon', roleName: 'Fleet Manager' },
    { email: 'finance@abcconstruction.com', firstName: 'Zerihun', lastName: 'Tadesse', roleName: 'Finance Officer' },
    { email: 'site@abcconstruction.com', firstName: 'Almaz', lastName: 'Desta', roleName: 'Site Manager' },
  ];

  const passwordHash = await bcrypt.hash('Password123!', 10);
  const users: Record<string, any> = {};

  for (const u of usersToSeed) {
    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        email: u.email,
        password: passwordHash,
        firstName: u.firstName,
        lastName: u.lastName,
      },
    });

    await prisma.userRole.create({
      data: {
        companyId: company.id,
        userId: user.id,
        roleId: roles[u.roleName].id,
      },
    });

    users[u.roleName] = user;
  }
  // Alias: stock movements that reference 'Machine Operator' role key
  users['Machine Operator'] = users['Site Manager'];
  console.log(`👤 Created ${usersToSeed.length} sample users.`);

  // 7. Create Projects & Sites
  const projectsData = [
    {
      name: 'Bole Road Expansion',
      code: 'BR-2026-01',
      clientName: 'Addis Ababa City Roads Authority (AACRA)',
      budget: 85000000,
      description: 'Widening of Bole road from Olympia to Airport Junction, including pedestrian paths and drainage infrastructure.',
      status: 'Active',
      startDate: new Date('2026-01-10'),
      endDate: new Date('2027-06-30'),
      sites: [
        { name: 'Olympia Junction Site', location: 'Bole Olympia, Addis Ababa', lat: 9.0065, lng: 38.7638 },
        { name: 'Rwanda Traffic Circle Site', location: 'Bole Rwanda, Addis Ababa', lat: 9.0120, lng: 38.7712 },
      ],
    },
    {
      name: 'Hawassa Housing Project',
      code: 'HH-2026-02',
      clientName: 'Ethiopian Construction Works Corporation (ECWC)',
      budget: 120000000,
      description: 'Construction of 10 low-income condominium housing blocks in Hawassa City for the national housing program.',
      status: 'Active',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2027-12-31'),
      sites: [
        { name: 'Hawassa Lake Side site', location: 'Hawassa Town, Sidama Region', lat: 7.0617, lng: 38.4764 },
      ],
    },
    {
      name: 'Dire Dawa Water Pipeline',
      code: 'DD-2025-03',
      clientName: 'Dire Dawa Water & Sewerage Authority (DDWSA)',
      budget: 45000000,
      description: 'Laying 18km of high-capacity water distribution pipes across Dire Dawa peripheral areas.',
      status: 'On Hold',
      startDate: new Date('2025-11-20'),
      endDate: new Date('2026-11-20'),
      sites: [
        { name: 'Ganda Site A', location: 'Ganda District, Dire Dawa City', lat: 9.5932, lng: 41.8671 },
      ],
    },
  ];

  const sites: Record<string, any> = {};
  const projects: Record<string, any> = {};

  for (const proj of projectsData) {
    const dbProj = await prisma.project.create({
      data: {
        companyId: company.id,
        projectName: proj.name,
        projectCode: proj.code,
        clientName: proj.clientName,
        budget: proj.budget,
        location: proj.sites[0]?.location || 'Addis Ababa',
        description: proj.description,
        status: proj.status,
        startDate: proj.startDate,
        endDate: proj.endDate,
        projectManagerId: users['Project Manager'].id,
        createdById: users['CEO / Owner'].id,
      },
    });
    projects[proj.name] = dbProj;

    for (const st of proj.sites) {
      const dbSite = await prisma.site.create({
        data: {
          companyId: company.id,
          projectId: dbProj.id,
          siteName: st.name,
          location: st.location,
          gpsLatitude: st.lat ?? 9.0123,
          gpsLongitude: st.lng ?? 38.7456,
          status: 'Active',
          siteManagerId: users['Site Manager'].id,
          createdById: users['CEO / Owner'].id,
        },
      });
      sites[st.name] = dbSite;
    }
  }
  console.log('🚧 Created projects and site locations.');

  // 8. Create Employees
  const employeesData = [
    { firstName: 'Abebe', middleName: 'Bekele', lastName: 'Kebede', code: 'EMP-001', position: 'Machine Operator', type: 'Permanent', status: 'Active', phone: '+251911223344', dailyRate: 500, salary: 13000, siteName: 'Olympia Junction Site' },
    { firstName: 'Mekdes', middleName: 'Haile', lastName: 'Alemu', code: 'EMP-002', position: 'Site Manager', type: 'Permanent', status: 'Active', phone: '+251911334455', dailyRate: 900, salary: 24000, siteName: 'Olympia Junction Site' },
    { firstName: 'Dawit', middleName: 'Gebre', lastName: 'Tesfaye', code: 'EMP-003', position: 'Driver', type: 'Contract', status: 'Active', phone: '+251912445566', dailyRate: 400, salary: 10500, siteName: 'Olympia Junction Site' },
    { firstName: 'Sara', middleName: 'Kassa', lastName: 'Tadesse', code: 'EMP-004', position: 'Inventory Manager', type: 'Permanent', status: 'Active', phone: '+251915998877', dailyRate: 800, salary: 21000, siteName: 'Olympia Junction Site' },
    { firstName: 'Yonas', middleName: 'Worku', lastName: 'Getachew', code: 'EMP-005', position: 'Mechanic', type: 'Permanent', status: 'Active', phone: '+251913334455', dailyRate: 550, salary: 14500, siteName: 'Olympia Junction Site' },
    { firstName: 'Kidist', middleName: 'Berhanu', lastName: 'Haile', code: 'EMP-006', position: 'HR Officer', type: 'Permanent', status: 'Active', phone: '+251919776655', dailyRate: 750, salary: 19500, siteName: 'Olympia Junction Site' },
    { firstName: 'Samuel', middleName: 'Tilahun', lastName: 'Girma', code: 'EMP-007', position: 'Foreman', type: 'Permanent', status: 'Active', phone: '+251918882211', dailyRate: 600, salary: 16000, siteName: 'Olympia Junction Site' },
    { firstName: 'Biruk', middleName: 'Desta', lastName: 'Kebede', code: 'EMP-008', position: 'Daily Laborer', type: 'Daily Laborer', status: 'Active', phone: '+251917773322', dailyRate: 250, salary: 0, siteName: 'Olympia Junction Site' },
    { firstName: 'Hana', middleName: 'Solomon', lastName: 'Tola', code: 'EMP-009', position: 'Mason', type: 'Contract', status: 'Active', phone: '+251916664433', dailyRate: 450, salary: 12000, siteName: 'Hawassa Lake Side site' },
    { firstName: 'Tigist', middleName: 'Mulugeta', lastName: 'Worku', code: 'EMP-010', position: 'Electrician', type: 'Contract', status: 'On Leave', phone: '+251915555544', dailyRate: 500, salary: 13500, siteName: 'Ganda Site A' },
    { firstName: 'Tariku', middleName: 'Negash', lastName: 'Mengistu', code: 'EMP-011', position: 'Machine Operator', type: 'Permanent', status: 'Active', phone: '+251912889900', dailyRate: 500, salary: 13000, siteName: 'Hawassa Lake Side site' },
  ];

  const employees: Record<string, any> = {};
  for (const emp of employeesData) {
    const dbEmp = await prisma.employee.create({
      data: {
        companyId: company.id,
        employeeCode: emp.code,
        firstName: emp.firstName,
        middleName: emp.middleName,
        lastName: emp.lastName,
        phone: emp.phone,
        position: emp.position,
        department: 'Operations',
        employmentType: emp.type,
        employmentStatus: emp.status,
        hireDate: new Date('2023-01-15'),
        dailyRate: emp.dailyRate,
        monthlySalary: emp.salary,
        role: emp.position,
        siteId: sites[emp.siteName]?.id,
        createdById: users['HR Manager'].id,
      },
    });
    employees[`${emp.firstName} ${emp.lastName}`] = dbEmp;
  }
  console.log(`👷 Seeded ${employeesData.length} employees.`);

  // 8b. Seed Employee Assignments
  const assignmentsData = [
    { empKey: 'Abebe Kebede', projKey: 'Bole Road Expansion', siteKey: 'Olympia Junction Site', pos: 'Senior Machine Operator' },
    { empKey: 'Mekdes Alemu', projKey: 'Bole Road Expansion', siteKey: 'Olympia Junction Site', pos: 'Site Manager' },
    { empKey: 'Dawit Tesfaye', projKey: 'Bole Road Expansion', siteKey: 'Olympia Junction Site', pos: 'Heavy Truck Driver' },
    { empKey: 'Samuel Girma', projKey: 'Bole Road Expansion', siteKey: 'Olympia Junction Site', pos: 'General Site Foreman' },
    { empKey: 'Biruk Kebede', projKey: 'Bole Road Expansion', siteKey: 'Olympia Junction Site', pos: 'Daily Site Laborer' },
    { empKey: 'Hana Tola', projKey: 'Hawassa Housing Project', siteKey: 'Hawassa Lake Side site', pos: 'Lead Mason' },
    { empKey: 'Tariku Mengistu', projKey: 'Hawassa Housing Project', siteKey: 'Hawassa Lake Side site', pos: 'Loader Operator' },
    { empKey: 'Tigist Worku', projKey: 'Dire Dawa Water Pipeline', siteKey: 'Ganda Site A', pos: 'Substation Electrician' },
  ];

  for (const asg of assignmentsData) {
    await prisma.employeeAssignment.create({
      data: {
        companyId: company.id,
        employeeId: employees[asg.empKey].id,
        projectId: projects[asg.projKey].id,
        siteId: sites[asg.siteKey].id,
        assignedById: users['HR Manager'].id,
        positionOnSite: asg.pos,
        startDate: new Date('2024-01-01'),
        status: 'Active',
      },
    });
  }
  console.log('📌 Seeded employee project assignments.');

  // 9. Seed Attendance Entries
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendanceRecords = [
    { empKey: 'Abebe Kebede', projKey: 'Bole Road Expansion', siteKey: 'Olympia Junction Site', status: 'Present', checkIn: '08:00', checkOut: '17:00', reg: 8, ot: 2 },
    { empKey: 'Mekdes Alemu', projKey: 'Bole Road Expansion', siteKey: 'Olympia Junction Site', status: 'Present', checkIn: '07:45', checkOut: '17:30', reg: 8, ot: 1 },
    { empKey: 'Dawit Tesfaye', projKey: 'Bole Road Expansion', siteKey: 'Olympia Junction Site', status: 'Late', checkIn: '09:15', checkOut: '17:00', reg: 7, ot: 0, notes: 'Traffic delay at Megena' },
    { empKey: 'Samuel Girma', projKey: 'Bole Road Expansion', siteKey: 'Olympia Junction Site', status: 'Present', checkIn: '08:00', checkOut: '17:00', reg: 8, ot: 0 },
    { empKey: 'Biruk Kebede', projKey: 'Bole Road Expansion', siteKey: 'Olympia Junction Site', status: 'Present', checkIn: '08:00', checkOut: '17:00', reg: 8, ot: 3 },
    { empKey: 'Hana Tola', projKey: 'Hawassa Housing Project', siteKey: 'Hawassa Lake Side site', status: 'Present', checkIn: '08:00', checkOut: '17:00', reg: 8, ot: 0 },
    { empKey: 'Tariku Mengistu', projKey: 'Hawassa Housing Project', siteKey: 'Hawassa Lake Side site', status: 'Absent', reg: 0, ot: 0, notes: 'Unannounced absence' },
    { empKey: 'Tigist Worku', projKey: 'Dire Dawa Water Pipeline', siteKey: 'Ganda Site A', status: 'On Leave', reg: 0, ot: 0, notes: 'Approved sick leave' },
  ];

  for (const att of attendanceRecords) {
    const inTime = att.checkIn ? new Date(`${today.toISOString().slice(0, 10)}T${att.checkIn}:00.000Z`) : null;
    const outTime = att.checkOut ? new Date(`${today.toISOString().slice(0, 10)}T${att.checkOut}:00.000Z`) : null;

    await prisma.attendance.create({
      data: {
        companyId: company.id,
        employeeId: employees[att.empKey].id,
        projectId: projects[att.projKey]?.id,
        siteId: sites[att.siteKey]?.id,
        attendanceDate: today,
        date: today,
        status: att.status,
        checkInTime: inTime,
        checkOutTime: outTime,
        regularHours: att.reg,
        overtimeHours: att.ot,
        notes: att.notes,
        remarks: att.notes,
        recordedById: users['HR Manager'].id,
      },
    });
  }
  console.log('📅 Seeded attendance entries for today.');

  // 9b. Seed Leave Requests
  await prisma.leaveRequest.create({
    data: {
      companyId: company.id,
      employeeId: employees['Tigist Worku'].id,
      requestedById: users['HR Manager'].id,
      approvedById: users['HR Manager'].id,
      leaveType: 'Sick Leave',
      startDate: new Date(Date.now() - 2 * 86400000),
      endDate: new Date(Date.now() + 2 * 86400000),
      totalDays: 4,
      status: 'Approved',
      reason: 'Doctor prescribed bed rest following flu.',
    },
  });

  await prisma.leaveRequest.create({
    data: {
      companyId: company.id,
      employeeId: employees['Abebe Kebede'].id,
      requestedById: users['HR Manager'].id,
      leaveType: 'Annual Leave',
      startDate: new Date(Date.now() + 5 * 86400000),
      endDate: new Date(Date.now() + 12 * 86400000),
      totalDays: 7,
      status: 'Pending',
      reason: 'Family vacation and annual holiday leave.',
    },
  });

  await prisma.leaveRequest.create({
    data: {
      companyId: company.id,
      employeeId: employees['Dawit Tesfaye'].id,
      requestedById: users['HR Manager'].id,
      approvedById: users['HR Manager'].id,
      leaveType: 'Emergency Leave',
      startDate: new Date(Date.now() - 10 * 86400000),
      endDate: new Date(Date.now() - 8 * 86400000),
      totalDays: 2,
      status: 'Rejected',
      reason: 'Personal errand',
      rejectionReason: 'Critical heavy haulage deadline during requested dates.',
    },
  });
  console.log('🌴 Seeded sample leave requests.');



  // 10. Seed Machinery
  const machinesData = [
    {
      key: 'CAT 320D Excavator',
      machineType: 'Excavator',
      brand: 'CAT',
      model: '320D',
      plateNumber: 'ET-3-A1234',
      serialNumber: 'SN-CAT320D-9988',
      capacity: '20 Tons',
      ownershipType: 'Owned',
      source: 'Internal Fleet',
      currentStatus: 'Active',
      operatorKey: 'Abebe Kebede',
      notes: 'Primary heavy excavator, in good working condition.',
    },
    {
      key: 'Volvo L90 Loader',
      machineType: 'Loader',
      brand: 'Volvo',
      model: 'L90',
      plateNumber: 'ET-3-A4321',
      serialNumber: 'SN-VOL90-7766',
      capacity: '15 Tons',
      ownershipType: 'Rented from Le’Kiray Marketplace',
      source: 'Le’Kiray Marketplace',
      currentStatus: 'Active',
      operatorKey: 'Tariku Mengistu',
      rentalStartDate: new Date('2026-01-01'),
      rentalEndDate: new Date('2026-12-31'),
      dailyRentalCost: 3500.0,
      hourlyRentalCost: 450.0,
      notes: 'Rented for road leveling tasks.',
    },
    {
      key: 'Sinotruk Dump Truck',
      machineType: 'Dump Truck',
      brand: 'Sinotruk',
      model: 'Howo 371',
      plateNumber: 'ET-3-A8765',
      serialNumber: 'SN-SINO371-5544',
      capacity: '25 Tons',
      ownershipType: 'Rented Externally',
      source: 'External Rental Provider',
      currentStatus: 'Active',
      rentalStartDate: new Date('2026-02-01'),
      rentalEndDate: new Date('2026-08-31'),
      dailyRentalCost: 4500.0,
      hourlyRentalCost: 600.0,
      notes: 'External supplier rental for heavy soil hauling.',
    },
    {
      key: 'CAT 140H Grader',
      machineType: 'Grader',
      brand: 'CAT',
      model: '140H',
      plateNumber: 'ET-3-A0101',
      serialNumber: 'SN-CAT140H-3322',
      capacity: '18 Tons',
      ownershipType: 'Owned',
      source: 'Internal Fleet',
      currentStatus: 'Under Maintenance',
      notes: 'Undergoing routine hydraulic hose replacement.',
    },
    {
      key: 'Concrete Mixer Truck',
      machineType: 'Concrete Mixer',
      brand: 'Sany',
      model: 'Mixer 10m3',
      plateNumber: 'ET-3-A9999',
      serialNumber: 'SN-SANY10-1122',
      capacity: '10 m3',
      ownershipType: 'Rented from Le’Kiray Marketplace',
      source: 'Le’Kiray Marketplace',
      currentStatus: 'Idle',
      rentalStartDate: new Date('2026-03-01'),
      rentalEndDate: new Date('2026-09-30'),
      dailyRentalCost: 2800.0,
      hourlyRentalCost: 350.0,
      notes: 'Ready for structural concrete casting assignments.',
    },
  ];

  const machines: Record<string, any> = {};
  for (const m of machinesData) {
    const dbMachine = await prisma.machine.create({
      data: {
        companyId: company.id,
        machineType: m.machineType,
        brand: m.brand,
        model: m.model,
        plateNumber: m.plateNumber,
        serialNumber: m.serialNumber,
        capacity: m.capacity,
        ownershipType: m.ownershipType,
        source: m.source,
        currentStatus: m.currentStatus,
        currentOperatorId: m.operatorKey ? employees[m.operatorKey].id : null,
        rentalStartDate: m.rentalStartDate || null,
        rentalEndDate: m.rentalEndDate || null,
        dailyRentalCost: m.dailyRentalCost || 0,
        hourlyRentalCost: m.hourlyRentalCost || 0,
        notes: m.notes,
        createdById: users['CEO / Owner'].id,
      },
    });
    machines[m.key] = dbMachine;
  }
  console.log(`💡 Seeded ${machinesData.length} machinery logs.`);

  // 11. Assign Machinery to sites
  const activeAssignments = [
    { machineKey: 'CAT 320D Excavator', siteKey: 'Olympia Junction Site', projectKey: 'Bole Road Expansion', operatorKey: 'Abebe Kebede' },
    { machineKey: 'Volvo L90 Loader', siteKey: 'Hawassa Lake Side site', projectKey: 'Hawassa Housing Project', operatorKey: 'Tariku Mengistu' },
    { machineKey: 'Sinotruk Dump Truck', siteKey: 'Ganda Site A', projectKey: 'Dire Dawa Water Pipeline' },
  ];

  for (const asg of activeAssignments) {
    const dbProj = projects[asg.projectKey];
    const dbSite = sites[asg.siteKey];
    const dbMachine = machines[asg.machineKey];
    const operatorId = asg.operatorKey ? employees[asg.operatorKey].id : null;

    await prisma.machineAssignment.create({
      data: {
        companyId: company.id,
        machineId: dbMachine.id,
        siteId: dbSite.id,
        projectId: dbProj.id,
        operatorId,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        status: 'Active',
        workingHours: 28.5,
        idleHours: 4.0,
        assignedById: users['CEO / Owner'].id,
        createdById: users['CEO / Owner'].id,
      },
    });

    await prisma.machine.update({
      where: { id: dbMachine.id },
      data: {
        currentProjectId: dbProj.id,
        currentSiteId: dbSite.id,
        currentOperatorId: operatorId,
        currentStatus: 'Active',
      },
    });
  }
  console.log('🔗 Assigned heavy machinery to active project sites.');

  // 12. Seed Warehouses & Site Stores
  const warehousesData = [
    { name: 'Main Warehouse - Addis Ababa', code: 'WH-ADD-001', type: 'Main Warehouse', location: 'Kaliti Industrial Zone, Addis Ababa' },
    { name: 'Bole Site Store', code: 'WH-BOL-002', type: 'Site Store', location: 'Bole Olympia Site Compound', proj: 'Bole Road Expansion', site: 'Olympia Junction Site' },
    { name: 'Hawassa Site Store', code: 'WH-HAW-003', type: 'Site Store', location: 'Hawassa Lake Side Compound', proj: 'Hawassa Housing Project', site: 'Hawassa Lake Side site' },
    { name: 'Dire Dawa Site Store', code: 'WH-DIR-004', type: 'Site Store', location: 'Ganda Compound, Dire Dawa', proj: 'Dire Dawa Water Pipeline', site: 'Ganda Site A' },
    { name: 'Fuel Store - Main Yard', code: 'WH-FUL-005', type: 'Fuel Store', location: 'Kaliti Depot Yard' },
    { name: 'Spare Parts Store', code: 'WH-SPR-006', type: 'Spare Parts Store', location: 'Central Workshop Yard' },
  ];

  const warehouses: Record<string, any> = {};
  for (const wh of warehousesData) {
    const dbWh = await prisma.warehouse.create({
      data: {
        companyId: company.id,
        warehouseName: wh.name,
        warehouseCode: wh.code,
        type: wh.type,
        location: wh.location,
        projectId: wh.proj ? projects[wh.proj]?.id : null,
        siteId: wh.site ? sites[wh.site]?.id : null,
        managerId: users['Inventory Manager'].id,
        status: 'Active',
      },
    });
    warehouses[wh.name] = dbWh;
  }
  console.log(`📦 Seeded ${warehousesData.length} storehouses.`);

  // 13. Seed Inventory Items
  const itemsData = [
    { name: 'Cement 50kg', code: 'MAT-CEM-001', category: 'Cement', unit: 'Bag', qty: 1200, min: 200, cost: 850, wh: 'Main Warehouse - Addis Ababa', isCon: true },
    { name: 'Rebar 16mm', code: 'MAT-REB-002', category: 'Rebar', unit: 'Ton', qty: 85, min: 15, cost: 125000, wh: 'Main Warehouse - Addis Ababa', isCon: true },
    { name: 'Sand', code: 'MAT-SND-003', category: 'Sand', unit: 'Cubic Meter', qty: 450, min: 50, cost: 1200, wh: 'Main Warehouse - Addis Ababa', isCon: true },
    { name: 'Diesel', code: 'MAT-FUE-004', category: 'Diesel', unit: 'Liter', qty: 15000, min: 2000, cost: 110.5, wh: 'Fuel Store - Main Yard', isFuel: true },
    { name: 'Safety Helmet', code: 'MAT-PPE-005', category: 'PPE', unit: 'Piece', qty: 250, min: 30, cost: 450, wh: 'Main Warehouse - Addis Ababa', isCon: true },
    { name: 'Electric Cable 4mm', code: 'MAT-ELE-006', category: 'Electrical Materials', unit: 'Roll', qty: 8, min: 15, cost: 4200, wh: 'Main Warehouse - Addis Ababa', isCon: true }, // Low stock!
    { name: 'Hydraulic Oil 20L', code: 'MAT-OIL-007', category: 'Fuel and Lubricants', unit: 'Piece', qty: 45, min: 10, cost: 3800, wh: 'Spare Parts Store', isSpare: true },
    { name: 'Excavator Bucket Tooth', code: 'MAT-SPT-008', category: 'Spare Parts', unit: 'Piece', qty: 24, min: 6, cost: 6500, wh: 'Spare Parts Store', isSpare: true },
    { name: 'PVC Pipe 110mm', code: 'MAT-PLM-009', category: 'Plumbing Materials', unit: 'Meter', qty: 300, min: 50, cost: 350, wh: 'Main Warehouse - Addis Ababa', isCon: true },
    { name: 'Waterproofing Chemical 20L', code: 'MAT-CHM-010', category: 'Finishing Materials', unit: 'Piece', qty: 0, min: 10, cost: 4800, wh: 'Main Warehouse - Addis Ababa', isCon: true }, // Out of stock!
  ];

  const items: Record<string, any> = {};
  for (const item of itemsData) {
    const totalVal = item.qty * item.cost;
    let status = 'Active';
    if (item.qty <= 0) status = 'Out of Stock';
    else if (item.qty <= item.min) status = 'Low Stock';

    const dbItem = await prisma.inventoryItem.create({
      data: {
        companyId: company.id,
        itemName: item.name,
        itemCode: item.code,
        category: item.category,
        unit: item.unit,
        currentQuantity: item.qty,
        minimumStockLevel: item.min,
        averageUnitCost: item.cost,
        totalValue: totalVal,
        defaultWarehouseId: warehouses[item.wh].id,
        isFuelItem: item.isFuel || false,
        isConsumable: item.isCon || false,
        isSparePart: item.isSpare || false,
        status,
        createdById: users['Inventory Manager'].id,
      },
    });
    items[item.name] = dbItem;

    // Stock-in initial movement
    if (item.qty > 0) {
      await prisma.stockMovement.create({
        data: {
          companyId: company.id,
          inventoryItemId: dbItem.id,
          toWarehouseId: warehouses[item.wh].id,
          movementType: 'STOCK_IN',
          quantity: item.qty,
          unitCost: item.cost,
          totalCost: totalVal,
          referenceNumber: `REC-INIT-${item.code}`,
          reason: 'Initial store inventory opening stock',
          requestedById: users['Inventory Manager'].id,
          approvedById: users['Inventory Manager'].id,
          issuedById: users['Inventory Manager'].id,
          createdById: users['Inventory Manager'].id,
          movementDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
      });
    }
  }
  console.log('🧱 Seeded inventory items.');

  // Additional Realistic Stock Movements
  // 1. Transfer Diesel to Bole Site Store
  await prisma.stockMovement.create({
    data: {
      companyId: company.id,
      inventoryItemId: items['Diesel'].id,
      fromWarehouseId: warehouses['Fuel Store - Main Yard'].id,
      toWarehouseId: warehouses['Bole Site Store'].id,
      projectId: projects['Bole Road Expansion'].id,
      siteId: sites['Olympia Junction Site'].id,
      movementType: 'TRANSFER',
      quantity: 2000,
      unitCost: 110.5,
      totalCost: 221000,
      referenceNumber: 'TRF-FUE-001',
      reason: 'Site generator and heavy machine refuel store dispatch',
      requestedById: users['Site Manager'].id,
      approvedById: users['Inventory Manager'].id,
      issuedById: users['Inventory Manager'].id,
      createdById: users['Inventory Manager'].id,
      movementDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  // 2. Stock-out Cement to Hawassa Housing Project
  await prisma.stockMovement.create({
    data: {
      companyId: company.id,
      inventoryItemId: items['Cement 50kg'].id,
      fromWarehouseId: warehouses['Main Warehouse - Addis Ababa'].id,
      projectId: projects['Hawassa Housing Project'].id,
      siteId: sites['Hawassa Lake Side site'].id,
      movementType: 'STOCK_OUT',
      quantity: 200,
      unitCost: 850,
      totalCost: 170000,
      referenceNumber: 'DISP-CEM-088',
      reason: 'Foundation concrete pour phase 2',
      requestedById: users['Site Manager'].id,
      approvedById: users['Inventory Manager'].id,
      issuedById: users['Inventory Manager'].id,
      createdById: users['Inventory Manager'].id,
      movementDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  // 3. Fuel issue Diesel to CAT 320D Excavator
  await prisma.stockMovement.create({
    data: {
      companyId: company.id,
      inventoryItemId: items['Diesel'].id,
      fromWarehouseId: warehouses['Bole Site Store'].id,
      projectId: projects['Bole Road Expansion'].id,
      siteId: sites['Olympia Junction Site'].id,
      machineId: machines['CAT 320D Excavator'].id,
      movementType: 'FUEL_ISSUE',
      quantity: 200,
      unitCost: 110.5,
      totalCost: 22100,
      referenceNumber: 'FUEL-CAT-320D-01',
      reason: 'Daily excavating operations refuel',
      requestedById: users['Site Manager'].id,
      approvedById: users['Fleet Manager'].id,
      issuedById: users['Inventory Manager'].id,
      createdById: users['Inventory Manager'].id,
      movementDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // 4. Damaged Safety Helmet record
  await prisma.stockMovement.create({
    data: {
      companyId: company.id,
      inventoryItemId: items['Safety Helmet'].id,
      fromWarehouseId: warehouses['Main Warehouse - Addis Ababa'].id,
      movementType: 'DAMAGED',
      quantity: 5,
      unitCost: 450,
      totalCost: 2250,
      referenceNumber: 'DMG-PPE-004',
      reason: 'Helmets cracked during transport offloading',
      requestedById: users['Inventory Manager'].id,
      approvedById: users['Inventory Manager'].id,
      issuedById: users['Inventory Manager'].id,
      createdById: users['Inventory Manager'].id,
      movementDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // 13b. Seed Inventory Requests
  // 1. Cement request for Hawassa Housing Project
  await prisma.inventoryRequest.create({
    data: {
      companyId: company.id,
      projectId: projects['Hawassa Housing Project'].id,
      siteId: sites['Hawassa Lake Side site'].id,
      inventoryItemId: items['Cement 50kg'].id,
      requestedById: users['Site Manager'].id,
      approvedById: users['Inventory Manager'].id,
      issuedById: users['Inventory Manager'].id,
      quantityRequested: 300,
      quantityApproved: 300,
      quantityIssued: 200,
      status: 'Partially Issued',
      priority: 'High',
      purpose: 'Block work and plastering for Block B',
      notes: 'Initial 200 bags dispatched, 100 bags remaining.',
      requestDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      approvedAt: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000),
      issuedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  // 2. Rebar request for Bole Road Expansion
  await prisma.inventoryRequest.create({
    data: {
      companyId: company.id,
      projectId: projects['Bole Road Expansion'].id,
      siteId: sites['Olympia Junction Site'].id,
      inventoryItemId: items['Rebar 16mm'].id,
      requestedById: users['Site Manager'].id,
      quantityRequested: 10,
      status: 'Pending',
      priority: 'Urgent',
      purpose: 'Underpass retaining wall reinforcement cage',
      notes: 'Required urgently before rain season casting.',
      requestDate: new Date(),
    },
  });

  // 3. Electric Cable urgent request for Dire Dawa Water Pipeline
  await prisma.inventoryRequest.create({
    data: {
      companyId: company.id,
      projectId: projects['Dire Dawa Water Pipeline'].id,
      siteId: sites['Ganda Site A'].id,
      inventoryItemId: items['Electric Cable 4mm'].id,
      requestedById: users['Site Manager'].id,
      quantityRequested: 5,
      status: 'Pending',
      priority: 'Urgent',
      purpose: 'Pump station main distribution wiring',
      requestDate: new Date(),
    },
  });

  console.log('📋 Seeded inventory requests.');

  // 14. Seed Fuel Workflow
  // Request 1: Issued fuel request & corresponding log (for CAT 320D)
  const req1 = await prisma.fuelRequest.create({
    data: {
      companyId: company.id,
      machineId: machines['CAT 320D Excavator'].id,
      projectId: projects['Bole Road Expansion'].id,
      siteId: sites['Olympia Junction Site'].id,
      operatorId: employees['Abebe Kebede'].id,
      requestedById: users['Site Manager'].id,
      litersRequested: 200,
      litersApproved: 200,
      litersIssued: 200,
      status: 'Issued',
      priority: 'High',
      purpose: 'Bole Road excavation phase',
      approvedById: users['Fleet Manager'].id,
      approvedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      issuedById: users['Fleet Manager'].id,
      issuedAt: new Date(Date.now() - 11 * 60 * 60 * 1000), // 11 hours ago
      requestDate: new Date(Date.now() - 15 * 60 * 60 * 1000),
      costPerLiter: 110.50, // ETB/liter
      totalCost: 22100.00,
      notes: 'Approved standard excavation quota.',
    },
  });

  await prisma.fuelLog.create({
    data: {
      companyId: company.id,
      fuelRequestId: req1.id,
      machineId: machines['CAT 320D Excavator'].id,
      projectId: projects['Bole Road Expansion'].id,
      siteId: sites['Olympia Junction Site'].id,
      operatorId: employees['Abebe Kebede'].id,
      issuedById: users['Fleet Manager'].id,
      litersUsed: 200,
      costPerLiter: 110.50,
      totalCost: 22100.00,
      usageDate: new Date(Date.now() - 11 * 60 * 60 * 1000),
      workingHours: 8.0,
      odometerOrHourMeterReading: 4238.1,
      notes: 'Dispensed at Bole Olympia Central Depot tank.',
    },
  });

  // Request 2: Approved, ready to issue (for Volvo L90 Loader)
  const req2 = await prisma.fuelRequest.create({
    data: {
      companyId: company.id,
      machineId: machines['Volvo L90 Loader'].id,
      projectId: projects['Hawassa Housing Project'].id,
      siteId: sites['Hawassa Lake Side site'].id,
      operatorId: employees['Tariku Mengistu'].id,
      requestedById: users['Site Manager'].id,
      litersRequested: 150,
      litersApproved: 150,
      status: 'Approved',
      priority: 'Normal',
      purpose: 'Road leveling compaction',
      approvedById: users['Fleet Manager'].id,
      approvedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      requestDate: new Date(Date.now() - 8 * 60 * 60 * 1000),
      costPerLiter: 110.50,
      totalCost: 16575.00,
      notes: 'Compactor fuel approval.',
    },
  });

  // Request 3: Pending request (for Sinotruk Dump Truck)
  await prisma.fuelRequest.create({
    data: {
      companyId: company.id,
      machineId: machines['Sinotruk Dump Truck'].id,
      projectId: projects['Dire Dawa Water Pipeline'].id,
      siteId: sites['Ganda Site A'].id,
      requestedById: users['Site Manager'].id,
      litersRequested: 250,
      status: 'Pending',
      priority: 'Urgent',
      purpose: 'Soil disposal haul loops',
      requestDate: new Date(),
    },
  });

  // Request 4: Rejected request (for Sany concrete mixer)
  await prisma.fuelRequest.create({
    data: {
      companyId: company.id,
      machineId: machines['Concrete Mixer Truck'].id,
      projectId: projects['Bole Road Expansion'].id,
      siteId: sites['Rwanda Traffic Circle Site'].id,
      requestedById: users['Site Manager'].id,
      litersRequested: 100,
      status: 'Rejected',
      priority: 'Low',
      purpose: 'Mock test mix',
      approvedById: users['Fleet Manager'].id,
      approvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      requestDate: new Date(Date.now() - 25 * 60 * 60 * 1000),
      rejectionReason: 'Mixer is currently idle and concrete casting is suspended until next week.',
    },
  });

  // Standalone manual Fuel Log
  await prisma.fuelLog.create({
    data: {
      companyId: company.id,
      machineId: machines['Volvo L90 Loader'].id,
      projectId: projects['Bole Road Expansion'].id,
      siteId: sites['Rwanda Traffic Circle Site'].id,
      operatorId: employees['Tariku Mengistu'].id,
      issuedById: users['Fleet Manager'].id,
      litersUsed: 120,
      costPerLiter: 110.50,
      totalCost: 13260.00,
      usageDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      workingHours: 6.5,
      odometerOrHourMeterReading: 1094.2,
      notes: 'Logged manual refueling from external mobile truck service.',
    },
  });
  console.log('⛽ Seeded fuel requests and fuel usage logs.');

  // 15. Maintenance record for CAT 140H Grader
  if (machines['CAT 140H Grader']) {
    await prisma.maintenanceRecord.create({
      data: {
        companyId: company.id,
        machineId: machines['CAT 140H Grader'].id,
        issueTitle: 'Engine Overheating & Hydraulic Cylinder Resealing',
        issueDescription: 'Hydraulic cylinder resealing and radiator oil change.',
        maintenanceType: 'Breakdown Repair',
        priority: 'Critical',
        status: 'In Progress',
        totalCost: 45000.00, // ETB
        reportedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdById: users['Fleet Manager'].id,
      },
    });
    console.log('🔧 Seeded active machine maintenance record.');
  }

  // 16. Seed Daily Site Reports
  const report1Date = new Date(Date.now() - 1 * 86400000);
  report1Date.setHours(0, 0, 0, 0);

  const report1 = await prisma.dailyReport.create({
    data: {
      companyId: company.id,
      projectId: projects['Bole Road Expansion'].id,
      siteId: sites['Olympia Junction Site'].id,
      date: report1Date,
      reportDate: report1Date,
      submittedById: users['Site Manager'].id,
      approvedById: users['CEO / Owner'].id,
      status: 'Approved',
      weatherCondition: 'Sunny',
      workCompleted: 'Excavated 180m underpass trench line, installed 40m PVC drainage piping, and poured 45m3 structural lean concrete.',
      workPlannedTomorrow: 'Cast main retaining wall foundation footings and bind rebar cages.',
      issuesOrBlockers: 'Minor morning traffic jam delayed aggregate dump truck delivery by 45 minutes.',
      safetyIncidents: 'No safety incidents reported today. PPE inspection conducted at 08:30 AM.',
      qualityIssues: 'Concrete slump tests measured 75mm, fully compliant with structural specifications.',
      generalNotes: 'Full crew operating on shift.',
      workersPresent: 14,
      workersAbsent: 1,
      totalRegularHours: 112,
      totalOvertimeHours: 18,
      machineryUsedCount: 3,
      fuelUsedLiters: 450,
      materialsUsedValue: 185000,
      submittedAt: new Date(Date.now() - 1 * 86400000 + 3600000 * 17),
      approvedAt: new Date(Date.now() - 1 * 86400000 + 3600000 * 19),
      createdById: users['Site Manager'].id,
    },
  });

  // Machinery used detail for Report 1
  if (machines['CAT 320D Excavator']) {
    await prisma.dailyReportMachinery.create({
      data: {
        companyId: company.id,
        dailyReportId: report1.id,
        machineId: machines['CAT 320D Excavator'].id,
        operatorId: employees['Abebe Kebede']?.id,
        workingHours: 8.0,
        idleHours: 1.0,
        fuelUsedLiters: 200,
        notes: 'Main trench excavation loop.',
      },
    });
  }

  const report2Date = new Date();
  report2Date.setHours(0, 0, 0, 0);

  await prisma.dailyReport.create({
    data: {
      companyId: company.id,
      projectId: projects['Hawassa Housing Project'].id,
      siteId: sites['Hawassa Lake Side site'].id,
      date: report2Date,
      reportDate: report2Date,
      submittedById: users['Site Manager'].id,
      status: 'Submitted',
      weatherCondition: 'Cloudy',
      workCompleted: 'Completed Block B ground floor masonry wall levelling and column formwork assembly.',
      workPlannedTomorrow: 'Cast 12 RC columns for Block B first floor.',
      issuesOrBlockers: 'Material Shortage: Urgent request pending for 16mm rebar tonnage.',
      safetyIncidents: 'No injuries. Minor scaffold clamp slipped, re-tightened by site foreman.',
      qualityIssues: 'Block alignment inspected and approved by Site Engineer.',
      generalNotes: 'Waiting for additional rebar shipment.',
      workersPresent: 18,
      workersAbsent: 2,
      totalRegularHours: 144,
      totalOvertimeHours: 8,
      machineryUsedCount: 2,
      fuelUsedLiters: 180,
      materialsUsedValue: 95000,
      submittedAt: new Date(),
      createdById: users['Site Manager'].id,
    },
  });

  await prisma.dailyReport.create({
    data: {
      companyId: company.id,
      projectId: projects['Dire Dawa Water Pipeline'].id,
      siteId: sites['Ganda Site A'].id,
      date: report2Date,
      reportDate: report2Date,
      submittedById: users['Site Manager'].id,
      status: 'Draft',
      weatherCondition: 'Sunny',
      workCompleted: 'Trenching along Section 2 pipeline corridor (80m completed).',
      workPlannedTomorrow: 'Lay 110mm PVC pipes and backfill.',
      issuesOrBlockers: 'None.',
      workersPresent: 8,
      workersAbsent: 0,
      totalRegularHours: 64,
      totalOvertimeHours: 0,
      machineryUsedCount: 1,
      fuelUsedLiters: 110,
      materialsUsedValue: 42000,
      createdById: users['Site Manager'].id,
    },
  });

  const report4Date = new Date(Date.now() - 3 * 86400000);
  report4Date.setHours(0, 0, 0, 0);

  await prisma.dailyReport.create({
    data: {
      companyId: company.id,
      projectId: projects['Bole Road Expansion'].id,
      siteId: sites['Rwanda Traffic Circle Site'].id,
      date: report4Date,
      reportDate: report4Date,
      submittedById: users['Site Manager'].id,
      status: 'Rejected',
      weatherCondition: 'Rainy',
      workCompleted: 'Sub-base soil compaction halted due to heavy afternoon rain.',
      workPlannedTomorrow: 'Re-compact sub-base layer after surface drying.',
      issuesOrBlockers: 'Rain flooded lower trench section.',
      safetyIncidents: 'Near miss: Dump truck wheel skidded on wet mud ramp. Tow truck pulled it out safely.',
      rejectionReason: 'Report missing detailed machinery hour meter readings and slump test log.',
      rejectedAt: new Date(Date.now() - 2.5 * 86400000),
      createdById: users['Site Manager'].id,
    },
  });

  console.log('📝 Seeded daily site reports.');

  // 17. Seed Maintenance Records & Parts
  const maint1 = await prisma.maintenanceRecord.create({
    data: {
      companyId: company.id,
      machineId: machines['CAT 320D Excavator'].id,
      projectId: projects['Bole Road Expansion'].id,
      siteId: sites['Olympia Junction Site'].id,
      reportedById: users['Site Manager'].id,
      assignedMechanicId: employees['Abebe Kebede']?.id,
      maintenanceType: 'Breakdown Repair',
      status: 'In Progress',
      priority: 'Urgent',
      issueTitle: 'Hydraulic Cylinder Oil Leak',
      issueDescription: 'Main excavation boom cylinder leaking high-pressure hydraulic fluid during digging loop.',
      diagnosis: 'Blown main boom piston rod seal gasket.',
      workPerformed: 'Disassembled boom cylinder and prepared new seal kit.',
      partsUsedValue: 14500.0,
      laborCost: 3500.0,
      externalServiceCost: 0.0,
      totalCost: 18000.0,
      downtimeHours: 5.5,
      reportedDate: new Date(Date.now() - 1 * 86400000),
      startedAt: new Date(Date.now() - 0.5 * 86400000),
      scheduledDate: new Date(Date.now() - 1 * 86400000),
      nextServiceDate: new Date(Date.now() + 30 * 86400000),
      odometerOrHourMeterReading: 4250.0,
      notes: 'Urgent repair on Bole Road underpass corridor.',
      createdById: users['Fleet Manager'].id,
    },
  });

  const maint2 = await prisma.maintenanceRecord.create({
    data: {
      companyId: company.id,
      machineId: machines['Volvo L90 Loader'].id,
      projectId: projects['Hawassa Housing Project'].id,
      siteId: sites['Hawassa Lake Side site'].id,
      reportedById: users['Fleet Manager'].id,
      assignedMechanicId: employees['Abebe Kebede']?.id,
      maintenanceType: 'Preventive Maintenance',
      status: 'Scheduled',
      priority: 'Normal',
      issueTitle: '500-Hour Scheduled Interval Service',
      issueDescription: 'Routine 500-hour engine oil filter, fuel filter, and transmission fluid replacement.',
      partsUsedValue: 8500.0,
      laborCost: 2000.0,
      externalServiceCost: 0.0,
      totalCost: 10500.0,
      downtimeHours: 0.0,
      reportedDate: new Date(),
      scheduledDate: new Date(Date.now() + 2 * 86400000),
      nextServiceDate: new Date(Date.now() + 60 * 86400000),
      odometerOrHourMeterReading: 1890.0,
      notes: 'Preventive service scheduled for weekend shift.',
      createdById: users['Fleet Manager'].id,
    },
  });

  const maint3 = await prisma.maintenanceRecord.create({
    data: {
      companyId: company.id,
      machineId: machines['Sinotruk Dump Truck'].id,
      projectId: projects['Bole Road Expansion'].id,
      siteId: sites['Rwanda Traffic Circle Site'].id,
      reportedById: users['Site Manager'].id,
      assignedMechanicId: employees['Yonas Getachew']?.id,
      maintenanceType: 'Tire Service',
      status: 'Completed',
      priority: 'High',
      issueTitle: 'Rear Axle Dual Tire Puncture & Replacement',
      issueDescription: 'Heavy rebar scrap on aggregate ramp punctured inner dual tire on rear axle.',
      diagnosis: 'Severe sidewall gash on 12.00R20 radial tire.',
      workPerformed: 'Replaced damaged tire with new heavy-duty radial tire and balanced rim assembly.',
      partsUsedValue: 24000.0,
      laborCost: 1500.0,
      externalServiceCost: 0.0,
      totalCost: 25500.0,
      downtimeHours: 3.0,
      reportedDate: new Date(Date.now() - 4 * 86400000),
      startedAt: new Date(Date.now() - 4 * 86400000 + 3600000 * 2),
      completedAt: new Date(Date.now() - 4 * 86400000 + 3600000 * 5),
      nextServiceDate: new Date(Date.now() + 90 * 86400000),
      odometerOrHourMeterReading: 34500.0,
      notes: 'Truck back in active service.',
      createdById: users['Fleet Manager'].id,
    },
  });

  // 17. Seed Manual Expenses & Project Revenue
  await prisma.expense.createMany({
    data: [
      {
        companyId: company.id,
        projectId: projects['Bole Road Expansion'].id,
        siteId: sites['Olympia Junction Site'].id,
        machineId: machines['CAT 320D Excavator'].id,
        expenseCategory: 'Fuel',
        expenseType: 'Operational',
        amount: 45000.0,
        currency: 'ETB',
        expenseDate: new Date(Date.now() - 5 * 86400000),
        description: 'Emergency diesel tank transport for Bole Road excavation shift.',
        vendorName: 'Kality Fuel Transports PLC',
        referenceNumber: 'INV-2026-0891',
        status: 'Approved',
        recordedById: users['Project Manager'].id,
        approvedById: users['CEO / Owner'].id,
      },
      {
        companyId: company.id,
        projectId: projects['Hawassa Housing Project'].id,
        siteId: sites['Hawassa Lake Side site'].id,
        expenseCategory: 'Subcontractor',
        expenseType: 'Direct Labor',
        amount: 120000.0,
        currency: 'ETB',
        expenseDate: new Date(Date.now() - 3 * 86400000),
        description: 'Subcontractor masonry labor support for Block B foundation pouring.',
        vendorName: 'Hawassa Masonry Union Subcontractors',
        referenceNumber: 'SUB-HW-042',
        status: 'Approved',
        recordedById: users['Site Manager'].id,
        approvedById: users['Project Manager'].id,
      },
      {
        companyId: company.id,
        projectId: projects['Dire Dawa Water Pipeline'].id,
        siteId: sites['Ganda Site A'].id,
        expenseCategory: 'Utilities',
        expenseType: 'Overhead',
        amount: 18500.0,
        currency: 'ETB',
        expenseDate: new Date(Date.now() - 2 * 86400000),
        description: 'High-voltage temporary site connection utility bill.',
        vendorName: 'Ethiopian Electric Utility (EEU)',
        referenceNumber: 'EEU-DD-9921',
        status: 'Recorded',
        recordedById: users['Finance Officer'].id,
      },
      {
        companyId: company.id,
        projectId: projects['Bole Road Expansion'].id,
        siteId: sites['Olympia Junction Site'].id,
        machineId: machines['CAT 320D Excavator'].id,
        expenseCategory: 'Maintenance',
        expenseType: 'Direct Repair',
        amount: 35000.0,
        currency: 'ETB',
        expenseDate: new Date(Date.now() - 1 * 86400000),
        description: 'External specialist hydraulic pump overhaul service.',
        vendorName: 'Ethio-Heavy Machinery Workshop PLC',
        referenceNumber: 'WRK-8812',
        status: 'Approved',
        recordedById: users['Fleet Manager'].id,
        approvedById: users['CEO / Owner'].id,
      },
      {
        companyId: company.id,
        projectId: projects['Bole Road Expansion'].id,
        expenseCategory: 'Permit / Government Fee',
        expenseType: 'Compliance',
        amount: 65000.0,
        currency: 'ETB',
        expenseDate: new Date(Date.now() - 7 * 86400000),
        description: 'Addis Ababa City right-of-way utility clearance permit fee.',
        vendorName: 'Addis Ababa City Roads Authority',
        referenceNumber: 'AACRA-PERM-0192',
        status: 'Approved',
        recordedById: users['Project Manager'].id,
        approvedById: users['CEO / Owner'].id,
      },
      {
        companyId: company.id,
        projectId: projects['Hawassa Housing Project'].id,
        siteId: sites['Hawassa Lake Side site'].id,
        expenseCategory: 'Tools and Equipment',
        expenseType: 'Operational',
        amount: 28000.0,
        currency: 'ETB',
        expenseDate: new Date(Date.now() - 4 * 86400000),
        description: 'Heavy vibrator pokers and safety harness tools purchase.',
        vendorName: 'Merkato Construction Tools PLC',
        referenceNumber: 'MKT-TL-4410',
        status: 'Approved',
        recordedById: users['Site Manager'].id,
      },
      // Additional expenses for better Finance module data
      {
        companyId: company.id,
        projectId: projects['Bole Road Expansion'].id,
        siteId: sites['Rwanda Traffic Circle Site'].id,
        expenseCategory: 'Materials',
        expenseType: 'Direct',
        amount: 980000.0,
        currency: 'ETB',
        expenseDate: new Date(Date.now() - 10 * 86400000),
        description: 'Crushed aggregate base material supply for sub-base road layer.',
        vendorName: 'Akaki Stone Quarry & Supply PLC',
        referenceNumber: 'AKQ-2026-0344',
        status: 'Approved',
        recordedById: users['Finance Officer'].id,
        approvedById: users['CEO / Owner'].id,
      },
      {
        companyId: company.id,
        projectId: projects['Hawassa Housing Project'].id,
        siteId: sites['Hawassa Lake Side site'].id,
        expenseCategory: 'Transport',
        expenseType: 'Operational',
        amount: 54000.0,
        currency: 'ETB',
        expenseDate: new Date(Date.now() - 6 * 86400000),
        description: 'Cement bag transport from Addis Ababa main warehouse to Hawassa site.',
        vendorName: 'Sheger Logistics & Transport PLC',
        referenceNumber: 'SHG-TRK-2026-109',
        status: 'Approved',
        recordedById: users['Finance Officer'].id,
        approvedById: users['Project Manager'].id,
      },
      {
        companyId: company.id,
        projectId: projects['Bole Road Expansion'].id,
        expenseCategory: 'Professional Services',
        expenseType: 'Overhead',
        amount: 42000.0,
        currency: 'ETB',
        expenseDate: new Date(Date.now() - 14 * 86400000),
        description: 'Structural engineering consultant site visit and report fee.',
        vendorName: 'Addis Engineering Consultants PLC',
        referenceNumber: 'AEC-CONS-0092',
        status: 'Approved',
        recordedById: users['Finance Officer'].id,
        approvedById: users['CEO / Owner'].id,
      },
    ],
  });
  console.log('💰 Seeded sample operational expenses.');

  // Seed Project Revenue / Contract Values
  await prisma.projectRevenue.createMany({
    data: [
      {
        companyId: company.id,
        projectId: projects['Bole Road Expansion'].id,
        amount: 85000000.0,
        currency: 'ETB',
        revenueDate: new Date(Date.now() - 30 * 86400000),
        description: 'Bole Road Expansion Contract Value - Segment A & B.',
        clientName: 'Addis Ababa City Roads Authority (AACRA)',
        invoiceNumber: 'IPC-01-Bole',
        status: 'Received',
        recordedById: users['CEO / Owner'].id,
      },
      {
        companyId: company.id,
        projectId: projects['Hawassa Housing Project'].id,
        amount: 120000000.0,
        currency: 'ETB',
        revenueDate: new Date(Date.now() - 60 * 86400000),
        description: 'Hawassa 500-Unit Residential Complex Contract.',
        clientName: 'Ethiopian Construction Works Corporation',
        invoiceNumber: 'IPC-02-HW',
        status: 'Invoiced',
        recordedById: users['CEO / Owner'].id,
      },
      {
        companyId: company.id,
        projectId: projects['Dire Dawa Water Pipeline'].id,
        amount: 45000000.0,
        currency: 'ETB',
        revenueDate: new Date(Date.now() - 45 * 86400000),
        description: 'Dire Dawa Water Line Extension Contract.',
        clientName: 'Dire Dawa Water & Sewerage Authority',
        invoiceNumber: 'IPC-01-DD',
        status: 'Recorded',
        recordedById: users['CEO / Owner'].id,
      },
    ],
  });
  console.log('💵 Seeded project contract revenue records.');

  // 17. Seed a few Audit Logs
  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      userId: users['CEO / Owner'].id,
      action: 'projects:create',
      details: 'CEO Kidus Getachew initialized Bole Road Expansion project.',
    },
  });
  await prisma.auditLog.create({
    data: {
      companyId: company.id,
      userId: users['Fleet Manager'].id,
      action: 'fuel:approve',
      details: 'Fleet Manager Daniel Solomon approved request ID ' + req1.id + ' for 200 Liters of Diesel.',
    },
  });
  console.log('📋 Seeded security audit logs.');

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
