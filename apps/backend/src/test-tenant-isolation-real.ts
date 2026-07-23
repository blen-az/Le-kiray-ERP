import { PrismaClient } from '@prisma/client';
import { ProjectsService } from './projects/projects.service';
import { SitesService } from './projects/sites.service';
import { MachineryService } from './machinery/machinery.service';
import { DashboardService } from './dashboard/dashboard.service';
import { FuelService } from './fuel/fuel.service';

const prisma = new PrismaClient();
const projectsService = new ProjectsService(prisma as any);
const sitesService = new SitesService(prisma as any);
const machineryService = new MachineryService(prisma as any);
const dashboardService = new DashboardService(prisma as any);
const fuelService = new FuelService(prisma as any);

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
      requestedById: 'mock-user-id',
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
    await fuelService.approveRequest(reqA.id, companyB.id, 'mock-user-id', {
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
    await fuelService.createRequest(companyB.id, 'mock-user-id', {
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

  // --- RULE 5: Company B user cannot view Company A dashboard data ---
  console.log('\n📊 Check 5: Verifying dashboard statistics scoping...');
  
  const statsB = await dashboardService.getCeoStats(companyB.id);
  const activeProjectsCountForB = statsB.kpis.activeProjects;
  if (activeProjectsCountForB === 0) {
    console.log('✅ PASS: Company B user cannot view Company A dashboard data (Active projects counted: 0).');
  } else {
    throw new Error(`❌ FAIL: Security Leak! Company B stats leaked Company A active projects count (${activeProjectsCountForB}).`);
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
