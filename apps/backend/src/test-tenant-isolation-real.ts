import { PrismaClient } from '@prisma/client';
import { ProjectsService } from './projects/projects.service';
import { SitesService } from './projects/sites.service';
import { MachineryService } from './machinery/machinery.service';
import { DashboardService } from './dashboard/dashboard.service';
import { FuelService } from './fuel/fuel.service';
import { InventoryService } from './inventory/inventory.service';
import { HrService } from './hr/hr.service';
import { ReportsService } from './reports/reports.service';
import { MaintenanceService } from './maintenance/maintenance.service';
import { FinanceService } from './finance/finance.service';

const prisma = new PrismaClient();
const projectsService = new ProjectsService(prisma as any);
const sitesService = new SitesService(prisma as any);
const machineryService = new MachineryService(prisma as any);
const dashboardService = new DashboardService(prisma as any);
const fuelService = new FuelService(prisma as any);
const inventoryService = new InventoryService(prisma as any);
const hrService = new HrService(prisma as any);
const reportsService = new ReportsService(prisma as any);
const maintenanceService = new MaintenanceService(prisma as any);
const financeService = new FinanceService(prisma as any);

async function runRealTest() {
  console.log('🧪 Starting Tenant Isolation Verification (Real PostgreSQL Database)...');

  // Attempt database connection check
  try {
    await prisma.$connect();
  } catch (err: any) {
    console.error('❌ Could not connect to PostgreSQL database.');
    console.error('Ensure that:');
    console.error(' 1. PostgreSQL service is active on port 5432 (local Windows service or container).');
    console.error(' 2. DATABASE_URL is configured correctly in "apps/backend/.env".');
    console.error('Error Details:', err.message || err);
    process.exit(1);
  }

  console.log('🛡️ Connected to PostgreSQL. Preparing test database records...');

  await prisma.dailyReportMachinery.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.dailyReportMaterial.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.dailyReportWorker.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.dailyReportPhoto.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.dailyReport.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.expense.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.projectRevenue.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.maintenancePart.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.maintenanceRecord.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.inventoryRequest.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.stockMovement.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.inventoryItem.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.warehouse.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.fuelLog.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.fuelRequest.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.machineAssignment.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.machine.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.leaveRequest.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.attendance.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.employeeAssignment.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.employee.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.site.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.project.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.company.deleteMany({
    where: { id: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });
  await prisma.user.deleteMany({
    where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
  });

  // 1. Setup two distinct companies
  const companyA = await prisma.company.create({
    data: {
      id: 'real-test-co-a',
      name: 'Alpha Real Corp PLC',
      country: 'Ethiopia',
      currency: 'ETB',
    },
  });

  const companyB = await prisma.company.create({
    data: {
      id: 'real-test-co-b',
      name: 'Beta Real Corp Ltd',
      country: 'Ethiopia',
      currency: 'ETB',
    },
  });

  const userA = await prisma.user.create({
    data: {
      id: 'real-test-user-a',
      companyId: companyA.id,
      email: 'usera@real-test-co-a.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'UserA',
    },
  });

  const userB = await prisma.user.create({
    data: {
      id: 'real-test-user-b',
      companyId: companyB.id,
      email: 'userb@real-test-co-b.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'UserB',
    },
  });

  console.log(`🏢 Seeded Companies:\n  - Company A: ${companyA.name}\n  - Company B: ${companyB.name}`);

  // 2. Create a project belonging to Company A
  const projectA = await prisma.project.create({
    data: {
      companyId: companyA.id,
      projectName: 'Alpha Corporate Office Bole',
      location: 'Bole Road, Addis Ababa',
      status: 'Active',
    },
  });
  console.log(`🚧 Created Project: "${projectA.projectName}" under Company A (${companyA.name})`);

  // --- RULE 1: Company A user can view Company A project ---
  console.log('\n🔍 Check 1: Verifying self-access (Company A)...');
  const viewSelf = await projectsService.findOne(projectA.id, companyA.id);
  if (viewSelf && viewSelf.projectName === 'Alpha Corporate Office Bole') {
    console.log('✅ PASS: Company A user can view its own project.');
  } else {
    throw new Error('❌ FAIL: Company A user could not view its own project.');
  }

  // --- RULE 2: Company B user cannot view Company A project ---
  console.log('\n🔍 Check 2: Verifying cross-read block (Company B)...');
  try {
    await projectsService.findOne(projectA.id, companyB.id);
    throw new Error('❌ FAIL: Security Leak! Company B user successfully read Company A project.');
  } catch (err: any) {
    if (err.message && err.message.includes('Project not found')) {
      console.log('✅ PASS: Company B user cannot view Company A project (Throws 404 Not Found).');
    } else {
      throw err;
    }
  }

  // --- RULE 3: Company B user cannot create site under Company A project ---
  console.log('\n✍️ Check 3: Verifying cross-site creation block...');
  try {
    await sitesService.create(companyB.id, projectA.id, 'mock-user-id', {
      siteName: 'Illegal Beta Site Compound',
      location: 'Bole Olympia',
      status: 'Active',
    });
    throw new Error('❌ FAIL: Security Leak! Company B user successfully added site under Company A project.');
  } catch (err: any) {
    if (err.message && err.message.includes('Project not found')) {
      console.log('✅ PASS: Company B user blocked from adding site under Company A project.');
    } else {
      throw err;
    }
  }

  // --- RULE 4: Company B user cannot assign machinery to Company A project ---
  console.log('\n✍️ Check 4: Verifying cross-machinery assignment block...');
  
  // Register machine under Company B
  const machineB = await prisma.machine.create({
    data: {
      companyId: companyB.id,
      machineType: 'Excavator',
      brand: 'Beta CAT',
      model: 'Excavator',
      plateNumber: 'ET-3-B9999',
      serialNumber: 'SN-BETACAT-1234',
      ownershipType: 'Owned',
      source: 'Internal Fleet',
      currentStatus: 'Available',
    },
  });

  // Create a valid site under Project A (acting as Company A)
  const siteA = await prisma.site.create({
    data: {
      companyId: companyA.id,
      projectId: projectA.id,
      siteName: 'Alpha Real Bole Site Store',
      location: 'Bole Olympia',
      status: 'Active',
    },
  });

  try {
    // Attempt to assign Company B's machine to Company A's Project/Site using Company B's scope
    await machineryService.assign(companyB.id, machineB.id, 'mock-user-id', {
      projectId: projectA.id,
      siteId: siteA.id,
      startDate: new Date().toISOString(),
    });
    throw new Error('❌ FAIL: Security Leak! Company B successfully assigned machinery to Company A project site.');
  } catch (err: any) {
    if (err.message && err.message.includes('Project must belong to the same company')) {
      console.log('✅ PASS: Company B user blocked from assigning machinery to Company A project site.');
    } else {
      throw err;
    }
  }

  // --- Check 4b: Company B user cannot view Company A machinery ---
  console.log('\n🔍 Check 4b: Verifying cross-machinery read block...');
  // Create a machine under Company A
  const machineA = await prisma.machine.create({
    data: {
      companyId: companyA.id,
      machineType: 'Excavator',
      brand: 'Alpha CAT',
      model: '320D',
      plateNumber: 'ET-3-A9999',
      serialNumber: 'SN-ALPHACAT-1234',
      ownershipType: 'Owned',
      source: 'Internal Fleet',
      currentStatus: 'Available',
    },
  });
  try {
    await machineryService.findOne(machineA.id, companyB.id);
    throw new Error('❌ FAIL: Security Leak! Company B user successfully read Company A machinery.');
  } catch (err: any) {
    if (err.message && err.message.includes('Machine not found')) {
      console.log('✅ PASS: Company B user cannot view Company A machinery (Throws 404).');
    } else {
      throw err;
    }
  }

  // --- Check 4c: Company B user cannot view Company A machinery history ---
  console.log('\n🔍 Check 4c: Verifying cross-machinery history block...');
  try {
    await machineryService.findHistory(machineA.id, companyB.id);
    throw new Error('❌ FAIL: Security Leak! Company B user successfully viewed Company A machinery history.');
  } catch (err: any) {
    if (err.message && err.message.includes('Machine not found')) {
      console.log('✅ PASS: Company B user cannot view Company A machinery history (Throws 404).');
    } else {
      throw err;
    }
  }

  // --- Check 4d: Company B user cannot assign Company A machinery ---
  console.log('\n✍️ Check 4d: Verifying cross-machinery assignment scoping...');
  try {
    await machineryService.assign(companyB.id, machineA.id, 'mock-user-id', {
      projectId: projectA.id,
      siteId: siteA.id,
      startDate: new Date().toISOString(),
    });
    throw new Error('❌ FAIL: Security Leak! Company B user successfully assigned Company A machinery.');
  } catch (err: any) {
    if (err.message && err.message.includes('Machine not found')) {
      console.log('✅ PASS: Company B user blocked from assigning Company A machinery.');
    } else {
      throw err;
    }
  }

  // Create operators for requests testing
  const operatorA = await prisma.employee.create({
    data: {
      id: 'real-test-op-a',
      companyId: companyA.id,
      firstName: 'Alpha',
      lastName: 'Operator',
      role: 'OPERATOR',
    },
  });

  const operatorB = await prisma.employee.create({
    data: {
      id: 'real-test-op-b',
      companyId: companyB.id,
      firstName: 'Beta',
      lastName: 'Operator',
      role: 'OPERATOR',
    },
  });

  // --- Check 4e: Company B user cannot view Company A fuel requests ---
  console.log('\n🔍 Check 4e: Verifying cross-fuel request read block...');
  const reqA = await prisma.fuelRequest.create({
    data: {
      companyId: companyA.id,
      projectId: projectA.id,
      siteId: siteA.id,
      machineId: machineA.id,
      operatorId: operatorA.id,
      requestedById: userA.id,
      litersRequested: 100,
      status: 'Pending',
      priority: 'Normal',
      requestDate: new Date(),
    },
  });

  try {
    await fuelService.findOneRequest(reqA.id, companyB.id);
    throw new Error('❌ FAIL: Security Leak! Company B user successfully read Company A fuel request.');
  } catch (err: any) {
    if (err.message && err.message.includes('Fuel request not found')) {
      console.log('✅ PASS: Company B user cannot view Company A fuel request (Throws 404).');
    } else {
      throw err;
    }
  }

  // --- Check 4f: Company B user cannot approve/reject Company A fuel requests ---
  console.log('\n✍️ Check 4f: Verifying cross-fuel request approval block...');
  try {
    await fuelService.approveRequest(reqA.id, companyB.id, userA.id, {
      litersApproved: 100,
      costPerLiter: 110.50,
    });
    throw new Error('❌ FAIL: Security Leak! Company B user successfully approved Company A fuel request.');
  } catch (err: any) {
    if (err.message && err.message.includes('Fuel request not found')) {
      console.log('✅ PASS: Company B user blocked from approving Company A fuel request (Throws 404).');
    } else {
      throw err;
    }
  }

  // --- Check 4g: Company B user cannot view Company A fuel reports ---
  console.log('\n📊 Check 4g: Verifying fuel reporting isolation...');
  const summaryB = await fuelService.getSummary(companyB.id);
  if (summaryB.totalCost === 0) {
    console.log('✅ PASS: Company B user fuel summary is isolated from Company A logs.');
  } else {
    throw new Error(`❌ FAIL: Security Leak! Company B fuel summary leaked Company A data (Total cost: ${summaryB.totalCost}).`);
  }

  // --- Check 4h: Company B user cannot create fuel request using Company A resources ---
  console.log('\n✍️ Check 4h: Verifying fuel request creation scoping...');
  try {
    await fuelService.createRequest(companyB.id, userA.id, {
      projectId: projectA.id,
      siteId: siteA.id,
      machineId: machineB.id,
      operatorId: operatorB.id,
      litersRequested: 50,
      requestDate: new Date().toISOString(),
      priority: 'Normal',
    });
    throw new Error('❌ FAIL: Security Leak! Company B successfully created request with Company A project.');
  } catch (err: any) {
    if (err.message && err.message.includes('Project must belong to the same company')) {
      console.log('✅ PASS: Company B user blocked from requesting fuel with Company A project.');
    } else {
      throw err;
    }
  }

  // --- RULE 6: Inventory Tenant Isolation Verification ---
  console.log('\n📦 Check 6a: Verifying Inventory Items and Warehouses Tenant Scoping...');
  const warehouseA = await inventoryService.createWarehouse(companyA.id, userA.id, {
    warehouseName: 'Alpha Central Warehouse',
    type: 'Main Warehouse',
    location: 'Bole, Addis Ababa',
  });

  const itemA = await inventoryService.createItem(companyA.id, userA.id, {
    itemName: 'Alpha Cement 50kg',
    category: 'Cement',
    unit: 'Bag',
    currentQuantity: 500,
    minimumStockLevel: 50,
    averageUnitCost: 850,
    defaultWarehouseId: warehouseA.id,
  });

  // Company A user can view Company A inventory
  const itemAView = await inventoryService.findOneItem(itemA.id, companyA.id);
  if (itemAView && itemAView.itemName === 'Alpha Cement 50kg') {
    console.log('✅ PASS: Company A user can view its own inventory item.');
  }

  // Company B user cannot view Company A inventory item
  try {
    await inventoryService.findOneItem(itemA.id, companyB.id);
    throw new Error('❌ FAIL: Security Leak! Company B user viewed Company A inventory item.');
  } catch (err: any) {
    if (err.message && err.message.includes('Inventory item not found')) {
      console.log('✅ PASS: Company B user blocked from viewing Company A inventory item (404).');
    } else {
      throw err;
    }
  }

  // Company B user cannot create stock movement using Company A item
  console.log('\n✍️ Check 6b: Verifying Stock Movement Cross-Company Block...');
  try {
    await inventoryService.recordMovement(companyB.id, userA.id, {
      inventoryItemId: itemA.id,
      movementType: 'STOCK_OUT',
      quantity: 50,
    });
    throw new Error('❌ FAIL: Security Leak! Company B created stock movement using Company A item.');
  } catch (err: any) {
    if (err.message && err.message.includes('Inventory item not found in this company')) {
      console.log('✅ PASS: Company B blocked from creating movement using Company A inventory item.');
    } else {
      throw err;
    }
  }

  // Company B user cannot create warehouse under Company A project/site
  console.log('\n✍️ Check 6c: Verifying Site Store Project Scoping Block...');
  try {
    await inventoryService.createWarehouse(companyB.id, userA.id, {
      warehouseName: 'Illegal Beta Site Store',
      type: 'Site Store',
      projectId: projectA.id,
      siteId: siteA.id,
    });
    throw new Error('❌ FAIL: Security Leak! Company B created site store under Company A project.');
  } catch (err: any) {
    if (err.message && err.message.includes('Project not found in this company')) {
      console.log('✅ PASS: Company B blocked from creating store under Company A project.');
    } else {
      throw err;
    }
  }

  // Material Request Isolation
  console.log('\n📋 Check 6d: Verifying Material Request Approval & Issuance Block...');
  const reqMatA = await inventoryService.createRequest(companyA.id, userA.id, {
    projectId: projectA.id,
    siteId: siteA.id,
    inventoryItemId: itemA.id,
    quantityRequested: 100,
    priority: 'High',
  });

  try {
    await inventoryService.approveRequest(reqMatA.id, companyB.id, userA.id, {
      quantityApproved: 100,
    });
    throw new Error('❌ FAIL: Security Leak! Company B approved Company A material request.');
  } catch (err: any) {
    if (err.message && err.message.includes('Inventory request not found')) {
      console.log('✅ PASS: Company B blocked from approving Company A material request (404).');
    } else {
      throw err;
    }
  }

  // Reporting Isolation
  console.log('\n📊 Check 6e: Verifying Inventory Reports Scoping...');
  const reportB = await inventoryService.getSummaryReport(companyB.id);
  if (reportB.totalItems === 0 && reportB.totalStockValue === 0) {
    console.log('✅ PASS: Company B inventory summary report is isolated from Company A items.');
  } else {
    throw new Error(`❌ FAIL: Security Leak! Company B inventory report leaked Company A data (Total items: ${reportB.totalItems}).`);
  }

  // --- RULE 6: Company B user cannot view or assign Company A employees ---
  console.log('\n👷 Check 6: Verifying HR & Attendance tenant isolation...');

  const empA = await hrService.createEmployee(companyA.id, 'user-a', {
    firstName: 'TenantTestA',
    lastName: 'Operator',
    phone: '+251999888777',
    position: 'Machine Operator',
    employmentType: 'Permanent',
    employmentStatus: 'Active',
    hireDate: '2025-01-01',
  });

  const empListB = await hrService.findAllEmployees(companyB.id);
  if (!empListB.find((e) => e.id === empA.id)) {
    console.log('✅ PASS: Company B user cannot view Company A employee record.');
  } else {
    throw new Error('❌ FAIL: Security Leak! Company B listed Company A employee.');
  }

  try {
    await hrService.findOneEmployee(empA.id, companyB.id);
    throw new Error('❌ FAIL: Security Leak! Company B read Company A employee by ID.');
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      console.log('✅ PASS: Company B user received 404 when attempting to view Company A employee detail.');
    } else throw err;
  }

  // --- RULE 7: Company B user cannot view, submit, or approve Company A daily reports ---
  console.log('\n📝 Check 7: Verifying Daily Site Reports tenant isolation...');

  const reportA = await reportsService.createReport(companyA.id, userA.id, {
    projectId: projectA.id,
    siteId: siteA.id,
    reportDate: '2026-07-24',
    workCompleted: 'Excavated 100m trench for Alpha Corp.',
    status: 'Submitted',
  });

  const reportsB = await reportsService.findAll(companyB.id);
  if (!reportsB.find((r) => r.id === reportA.id)) {
    console.log('✅ PASS: Company B user cannot view Company A daily site report.');
  } else {
    throw new Error('❌ FAIL: Security Leak! Company B listed Company A daily site report.');
  }

  try {
    await reportsService.approveReport(reportA.id, companyB.id, userB.id, 'Approved by B');
    throw new Error('❌ FAIL: Security Leak! Company B user approved Company A daily report.');
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      console.log('✅ PASS: Company B user received 404 when attempting to approve Company A daily report.');
    } else throw err;
  }

  const todayStatusB = await reportsService.getTodayStatus(companyB.id);
  if (todayStatusB.sites.length === 0) {
    console.log("✅ PASS: Company B user cannot see Company A today's site submission status.");
  } else {
    throw new Error("❌ FAIL: Security Leak! Company B today status leaked Company A sites.");
  }

  // --- RULE 8: Company B user cannot view, start, or complete Company A maintenance records ---
  console.log('\n🔧 Check 8: Verifying Maintenance Management tenant isolation...');

  const maintA = await maintenanceService.create(companyA.id, userA.id, {
    machineId: machineA.id,
    projectId: projectA.id,
    siteId: siteA.id,
    maintenanceType: 'Breakdown Repair',
    priority: 'Urgent',
    issueTitle: 'Hydraulic Cylinder Leak Company A',
    reportedDate: '2026-07-24',
  });

  const maintsB = await maintenanceService.findAll(companyB.id);
  if (!maintsB.find((m) => m.id === maintA.id)) {
    console.log('✅ PASS: Company B user cannot view Company A maintenance record.');
  } else {
    throw new Error('❌ FAIL: Security Leak! Company B listed Company A maintenance record.');
  }

  try {
    await maintenanceService.start(maintA.id, companyB.id, userB.id, {});
    throw new Error('❌ FAIL: Security Leak! Company B user started Company A maintenance record.');
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      console.log('✅ PASS: Company B user received 404 when attempting to start Company A maintenance.');
    } else throw err;
  }

  try {
    await maintenanceService.create(companyB.id, userB.id, {
      machineId: machineA.id,
      maintenanceType: 'Oil Change',
      priority: 'Normal',
      issueTitle: 'Unauthorized Machine Maintenance',
      reportedDate: '2026-07-24',
    });
    throw new Error('❌ FAIL: Security Leak! Company B created maintenance for Company A machine.');
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      console.log('✅ PASS: Company B blocked from creating maintenance on Company A machine (400).');
    } else throw err;
  }

  // --- RULE 9: Company B user cannot view, create, or approve Company A expenses or project financial reports ---
  console.log('\n💰 Check 9: Verifying Finance Lite tenant isolation...');

  const expA = await financeService.createExpense(companyA.id, userA.id, {
    projectId: projectA.id,
    siteId: siteA.id,
    expenseCategory: 'Fuel',
    amount: 15000.0,
    expenseDate: '2026-07-24',
    description: 'Emergency diesel transport for Company A project',
  });

  const expBList = await financeService.findAllExpenses(companyB.id);
  if (!expBList.find((e) => e.id === expA.id)) {
    console.log('✅ PASS: Company B user cannot view Company A expense record.');
  } else {
    throw new Error('❌ FAIL: Security Leak! Company B listed Company A expense record.');
  }

  try {
    await financeService.approveExpense(expA.id, companyB.id, userB.id, { status: 'Approved' });
    throw new Error('❌ FAIL: Security Leak! Company B user approved Company A expense.');
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      console.log('✅ PASS: Company B user received 404 when attempting to approve Company A expense.');
    } else throw err;
  }

  try {
    await financeService.createExpense(companyB.id, userB.id, {
      projectId: projectA.id,
      expenseCategory: 'Subcontractor',
      amount: 50000.0,
      expenseDate: '2026-07-24',
    });
    throw new Error('❌ FAIL: Security Leak! Company B recorded expense under Company A project.');
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      console.log('✅ PASS: Company B user blocked from creating expense for Company A project (400).');
    } else throw err;
  }

  console.log('\n🎉 ALL REAL DATABASE TENANT ISOLATION CHECKS PASSED SUCCESSFULLY!');
}

runRealTest()
  .catch((e) => {
    console.error('❌ Real Database Tenant Isolation Verification Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Clean up test records to leave the database clean
    try {
      await prisma.dailyReportMachinery.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.dailyReportMaterial.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.dailyReportWorker.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.dailyReportPhoto.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.dailyReport.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.expense.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.projectRevenue.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.maintenancePart.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.maintenanceRecord.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.inventoryRequest.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.stockMovement.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.inventoryItem.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.warehouse.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.fuelLog.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.fuelRequest.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.machineAssignment.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.machine.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.leaveRequest.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.attendance.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.employeeAssignment.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.employee.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.site.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.project.deleteMany({
        where: { companyId: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
      await prisma.company.deleteMany({
        where: { id: { in: ['real-test-co-a', 'real-test-co-b'] } },
      });
    } catch {}
    await prisma.$disconnect();
  });
