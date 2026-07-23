import { ProjectsService } from './projects/projects.service';
import { SitesService } from './projects/sites.service';

// Mock Prisma client to execute fully in-memory without active postgres connection
class MockPrisma {
  companies: any[] = [];
  projects: any[] = [];
  sites: any[] = [];

  company = {
    upsert: async (args: any) => {
      let co = this.companies.find((c) => c.id === args.create.id);
      if (!co) {
        co = args.create;
        this.companies.push(co);
      }
      return co;
    },
  };

  project = {
    deleteMany: async (args: any) => {
      this.projects = this.projects.filter((p) => p.companyId !== args.where.companyId);
    },
    create: async (args: any) => {
      const p = { id: Math.random().toString(), ...args.data };
      this.projects.push(p);
      return p;
    },
    findFirst: async (args: any) => {
      const { id, companyId } = args.where;
      return this.projects.find((p) => p.id === id && p.companyId === companyId) || null;
    },
    findMany: async (args: any) => {
      const { companyId } = args.where;
      return this.projects.filter((p) => p.companyId === companyId && !p.deletedAt);
    },
  };

  site = {
    create: async (args: any) => {
      const s = { id: Math.random().toString(), ...args.data };
      this.sites.push(s);
      return s;
    },
    findFirst: async (args: any) => {
      const { id, companyId, projectId } = args.where;
      return this.sites.find((s) => 
        s.id === id && 
        s.companyId === companyId && 
        (!projectId || s.projectId === projectId)
      ) || null;
    },
  };
}

const mockPrisma = new MockPrisma();
// Inject mock prisma
const projectsService = new ProjectsService(mockPrisma as any);
const sitesService = new SitesService(mockPrisma as any);

async function runTest() {
  console.log('🧪 Starting Tenant Isolation Verification (Offline Mock Mode)...');

  // 1. Setup two distinct companies
  const companyA = await mockPrisma.company.upsert({
    where: { id: 'test-company-alpha-id' },
    update: {},
    create: {
      id: 'test-company-alpha-id',
      name: 'Company Alpha PLC',
      country: 'Ethiopia',
      currency: 'ETB',
    },
  });

  const companyB = await mockPrisma.company.upsert({
    where: { id: 'test-company-beta-id' },
    update: {},
    create: {
      id: 'test-company-beta-id',
      name: 'Company Beta Ltd',
      country: 'Ethiopia',
      currency: 'ETB',
    },
  });

  console.log(`🏢 Seeded Companies: \n  - Company A: ${companyA.name}\n  - Company B: ${companyB.name}`);

  // 2. Create a project belonging to Company A
  await mockPrisma.project.deleteMany({ where: { companyId: companyA.id } });

  const projectAlpha = await projectsService.create(companyA.id, 'mock-user-id', {
    projectName: 'Alpha Secret Bole HQ',
    location: 'Bole Road, Addis Ababa',
    status: 'Active',
  });
  console.log(`🚧 Created Project: "${projectAlpha.projectName}" under Company A (${companyA.name})`);

  // 3. VERIFY READ ISOLATION
  console.log('\n🔍 Verification Phase 1: Checking Read Scoping...');
  
  // Try querying Project Alpha using Company A's scope
  const readSuccess = await projectsService.findOne(projectAlpha.id, companyA.id);
  if (readSuccess && readSuccess.projectName === 'Alpha Secret Bole HQ') {
    console.log('✅ PASS: Company Alpha can view its own project.');
  } else {
    throw new Error('❌ FAIL: Company Alpha could not view its own project.');
  }

  // Try querying Project Alpha using Company B's scope
  try {
    await projectsService.findOne(projectAlpha.id, companyB.id);
    throw new Error('❌ FAIL: Security Leak! Company Beta read Company Alpha\'s project.');
  } catch (err: any) {
    if (err.message && err.message.includes('Project not found')) {
      console.log('✅ PASS: Company Beta cannot view Company Alpha\'s project (Throws 404 Not Found).');
    } else {
      throw err;
    }
  }

  // 4. VERIFY WRITE ISOLATION (CROSS-TENANT RESOURCE ATTACHMENT)
  console.log('\n✍️ Verification Phase 2: Checking Write Scoping...');
  
  try {
    // Try adding a site under Project Alpha, but scope the request to Company B!
    await sitesService.create(companyB.id, projectAlpha.id, 'mock-user-id', {
      siteName: 'Illegal Beta Site Store',
      location: 'Addis Ababa',
      status: 'Active',
    });
    throw new Error('❌ FAIL: Security Leak! Company Beta added a Site under Company Alpha\'s Project.');
  } catch (err: any) {
    if (err.message && err.message.includes('Project not found')) {
      console.log('✅ PASS: Company Beta blocked from adding Site under Company Alpha\'s Project.');
    } else {
      throw err;
    }
  }

  console.log('\n🎉 ALL TENANT ISOLATION CHECKS PASSED SUCCESSFULLY!');
}

runTest()
  .catch((e) => {
    console.error('❌ Tenant Isolation Verification Failed:', e);
    process.exit(1);
  });
