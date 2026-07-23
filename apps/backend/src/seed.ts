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
    { action: 'projects:create', description: 'Create new construction projects' },
    { action: 'projects:view', description: 'View project details and list' },
    { action: 'machinery:create', description: 'Add new heavy machinery' },
    { action: 'machinery:assign', description: 'Assign machinery to project sites' },
    { action: 'fuel:request', description: 'Submit fuel replenishment requests' },
    { action: 'fuel:approve', description: 'Approve or reject fuel requests' },
    { action: 'inventory:stock_in', description: 'Record warehouse item check-ins' },
    { action: 'inventory:stock_out', description: 'Record material dispatch to site' },
    { action: 'attendance:create', description: 'Register operator and worker check-ins' },
    { action: 'reports:view', description: 'View daily site logs' },
    { action: 'reports:export', description: 'Export daily site logs' },
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
  // Map CEO to all permissions
  for (const act of permissionActions) {
    await prisma.rolePermission.create({
      data: {
        roleId: roles['CEO / Owner'].id,
        permissionId: permissions[act.action].id,
      },
    });
  }
  // Fleet Manager permissions
  const fleetPerms = ['machinery:create', 'machinery:assign', 'fuel:approve', 'reports:view'];
  for (const p of fleetPerms) {
    await prisma.rolePermission.create({
      data: {
        roleId: roles['Fleet Manager'].id,
        permissionId: permissions[p].id,
      },
    });
  }
  // Site Manager permissions
  const sitePerms = ['fuel:request', 'attendance:create', 'reports:view'];
  for (const p of sitePerms) {
    await prisma.rolePermission.create({
      data: {
        roleId: roles['Site Manager'].id,
        permissionId: permissions[p].id,
      },
    });
  }
  // Inventory Manager permissions
  const invPerms = ['inventory:stock_in', 'inventory:stock_out', 'reports:view'];
  for (const p of invPerms) {
    await prisma.rolePermission.create({
      data: {
        roleId: roles['Inventory Manager'].id,
        permissionId: permissions[p].id,
      },
    });
  }
  // HR Manager permissions
  const hrPerms = ['attendance:create', 'reports:view'];
  for (const p of hrPerms) {
    await prisma.rolePermission.create({
      data: {
        roleId: roles['HR Manager'].id,
        permissionId: permissions[p].id,
      },
    });
  }
  // Project Manager permissions
  const pmPerms = ['projects:view', 'reports:view', 'reports:export', 'attendance:create'];
  for (const p of pmPerms) {
    await prisma.rolePermission.create({
      data: {
        roleId: roles['Project Manager'].id,
        permissionId: permissions[p].id,
      },
    });
  }
  console.log('🔗 Role-Permission mappings established.');

  // 6. Create Users
  const usersToSeed = [
    { email: 'ceo@abcconstruction.com', firstName: 'Kidus', lastName: 'Getachew', roleName: 'CEO / Owner' },
    { email: 'pm@abcconstruction.com', firstName: 'Mulugeta', lastName: 'Assefa', roleName: 'Project Manager' },
    { email: 'hr@abcconstruction.com', firstName: 'Hana', lastName: 'Tekle', roleName: 'HR Manager' },
    { email: 'inventory@abcconstruction.com', firstName: 'Yonas', lastName: 'Bekele', roleName: 'Inventory Manager' },
    { email: 'fleet@abcconstruction.com', firstName: 'Daniel', lastName: 'Solomon', roleName: 'Fleet Manager' },
    { email: 'site@abcconstruction.com', firstName: 'Almaz', lastName: 'Desta', roleName: 'Site Manager' },
  ];

  const passwordHash = await bcrypt.hash('password123', 10);
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
  console.log(`👤 Created ${usersToSeed.length} sample users.`);

  // 7. Create Projects & Sites
  const projectsData = [
    {
      name: 'Bole Road Expansion',
      description: 'Widening of Bole road from Olympia to Airport, including pedestrian paths.',
      status: 'ACTIVE',
      startDate: new Date('2026-01-10'),
      sites: [
        { name: 'Olympia Junction Site', location: 'Bole Olympia, Addis Ababa' },
        { name: 'Rwanda Traffic Circle Site', location: 'Bole Rwanda, Addis Ababa' },
      ],
    },
    {
      name: 'Hawassa Housing Project',
      description: 'Construction of 10 low-income housing blocks in Hawassa City.',
      status: 'ACTIVE',
      startDate: new Date('2026-03-01'),
      sites: [
        { name: 'Hawassa Lake Side site', location: 'Hawassa Town, Sidama' },
      ],
    },
    {
      name: 'Dire Dawa Water Pipeline',
      description: 'Laying out high-capacity water pipes across Dire Dawa peripheral areas.',
      status: 'ON_HOLD',
      startDate: new Date('2025-11-20'),
      sites: [
        { name: 'Ganda Site A', location: 'Dire Dawa Town' },
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
        location: proj.sites[0]?.location || 'Addis Ababa',
        description: proj.description,
        status: proj.status === 'ACTIVE' ? 'Active' : 'Planning',
        startDate: proj.startDate,
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
          gpsLatitude: 9.0123,
          gpsLongitude: 38.7456,
          status: 'Active',
          siteManagerId: users['Site Manager'].id,
          createdById: users['CEO / Owner'].id,
        },
      });
      sites[st.name] = dbSite;
    }
  }
  console.log('🚧 Created projects and site locations.');

  // 8. Create Employees (operators and laborers)
  const employeesData = [
    { firstName: 'Abebe', lastName: 'Kebede', role: 'OPERATOR', phone: '+251911223344', siteName: 'Olympia Junction Site' },
    { firstName: 'Tariku', lastName: 'Mengistu', role: 'OPERATOR', phone: '+251912445566', siteName: 'Rwanda Traffic Circle Site' },
    { firstName: 'Genet', lastName: 'Alemu', role: 'LABORER', phone: '+251915998877', siteName: 'Olympia Junction Site' },
    { firstName: 'Zewdu', lastName: 'Hailu', role: 'LABORER', phone: '+251913334455', siteName: 'Hawassa Lake Side site' },
    { firstName: 'Fasil', lastName: 'Demeke', role: 'FOREMAN', phone: '+251919776655', siteName: 'Olympia Junction Site' },
  ];

  const employees: Record<string, any> = {};
  for (const emp of employeesData) {
    const dbEmp = await prisma.employee.create({
      data: {
        companyId: company.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        role: emp.role,
        phone: emp.phone,
        siteId: sites[emp.siteName].id,
      },
    });
    employees[`${emp.firstName} ${emp.lastName}`] = dbEmp;
  }
  console.log(`👷 Seeded ${employeesData.length} employees.`);

  // 9. Seed Today's Attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendanceRecords = [
    { empKey: 'Abebe Kebede', status: 'PRESENT' },
    { empKey: 'Tariku Mengistu', status: 'LATE', remarks: 'Late due to traffic at Bole' },
    { empKey: 'Genet Alemu', status: 'PRESENT' },
    { empKey: 'Zewdu Hailu', status: 'ON_LEAVE', remarks: 'Sick leave approved' },
    { empKey: 'Fasil Demeke', status: 'PRESENT' },
  ];

  for (const att of attendanceRecords) {
    await prisma.attendance.create({
      data: {
        companyId: company.id,
        employeeId: employees[att.empKey].id,
        date: today,
        status: att.status,
        remarks: att.remarks,
        recordedById: users['HR Manager'].id,
      },
    });
  }
  console.log('📅 Seeded attendance entries for today.');

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

  // 12. Seed Warehouses
  const warehousesData = [
    { name: 'Bole Central Store', location: 'Bole, Addis Ababa' },
    { name: 'Hawassa Site Store', location: 'Hawassa Site Compound' },
  ];

  const warehouses: Record<string, any> = {};
  for (const wh of warehousesData) {
    const dbWh = await prisma.warehouse.create({
      data: {
        companyId: company.id,
        name: wh.name,
        location: wh.location,
      },
    });
    warehouses[wh.name] = dbWh;
  }
  console.log(`📦 Seeded ${warehousesData.length} storehouses.`);

  // 13. Seed Inventory Items & Stock Movement
  const itemsData = [
    { whName: 'Bole Central Store', name: 'Cement 50kg', category: 'CEMENT', unit: 'BAGS', qty: 250, alert: 50 },
    { whName: 'Bole Central Store', name: 'Rebar 16mm', category: 'REBAR', unit: 'PCS', qty: 180, alert: 30 },
    { whName: 'Bole Central Store', name: 'Diesel', category: 'FUEL', unit: 'LITERS', qty: 4500, alert: 500 },
    { whName: 'Bole Central Store', name: 'Safety Helmet', category: 'SAFETY', unit: 'PCS', qty: 120, alert: 15 },
    { whName: 'Bole Central Store', name: 'Electric Cable', category: 'CABLE', unit: 'ROLLS', qty: 8, alert: 10 }, // Below alert threshold!
    { whName: 'Hawassa Site Store', name: 'Cement 50kg', category: 'CEMENT', unit: 'BAGS', qty: 120, alert: 20 },
    { whName: 'Hawassa Site Store', name: 'Sand', category: 'AGGREGATE', unit: 'M3', qty: 45, alert: 10 },
  ];

  const items: Record<string, any> = {};
  for (const item of itemsData) {
    const dbItem = await prisma.inventoryItem.create({
      data: {
        companyId: company.id,
        warehouseId: warehouses[item.whName].id,
        name: item.name,
        category: item.category,
        unit: item.unit,
        quantity: item.qty,
        minStockAlert: item.alert,
      },
    });
    items[`${item.whName} - ${item.name}`] = dbItem;

    // Create Initial stock-in movement
    await prisma.stockMovement.create({
      data: {
        companyId: company.id,
        inventoryItemId: dbItem.id,
        warehouseId: warehouses[item.whName].id,
        quantity: item.qty,
        movementType: 'STOCK_IN',
        approvedById: users['Inventory Manager'].id,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      },
    });
  }
  console.log('🧱 Seeded inventory items and logged stock movement logs.');

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
  await prisma.maintenanceRecord.create({
    data: {
      companyId: company.id,
      machineId: machines['CAT 140H Grader'].id,
      description: 'Hydraulic cylinder resealing and oil change.',
      maintenanceType: 'BREAKDOWN',
      cost: 45000.00, // ETB
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: null, // Still in progress
      createdById: users['Fleet Manager'].id,
    },
  });
  console.log('🔧 Seeded active machine maintenance record.');

  // 16. Daily Report for today
  await prisma.dailyReport.create({
    data: {
      companyId: company.id,
      projectId: projects['Bole Road Expansion'].id,
      siteId: sites['Olympia Junction Site'].id,
      date: today,
      workCompleted: 'Excavated 150m trench line. Laid base course level from chainage 1+200 to 1+350. Completed asphalt edge cutting.',
      machineryUsed: 'CAT 320D Excavator (8 hrs active), Volvo L90 Loader (4 hrs active), Sinotruk Dump Truck (10 trips)',
      workersPresent: 18,
      materialsUsed: 'Cement: 25 bags, Sand: 5m3, Diesel: 200 Liters',
      fuelUsed: 200,
      issuesBlockers: 'High congestion at Olympia intersection delayed dump truck return loops. Rain started around 4:30 PM, causing early site closure.',
      photos: JSON.stringify(['https://example.com/site-photos/bole-road-trench.jpg']),
      submittedById: users['Site Manager'].id,
    },
  });
  console.log('📝 Seeded today\'s daily site report.');

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
