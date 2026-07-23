import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getCeoStats(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Total Active Projects
    const activeProjectsCount = await this.prisma.project.count({
      where: { companyId, status: { in: ['Active', 'ACTIVE', 'On Track', 'At Risk', 'Delayed'] }, deletedAt: null },
    });

    // 2. Machinery Utilization
    const totalMachines = await this.prisma.machine.count({
      where: { companyId, deletedAt: null },
    });
    const activeMachines = await this.prisma.machine.count({
      where: { companyId, currentStatus: { in: ['Active', 'Assigned'] }, deletedAt: null },
    });
    const maintenanceMachines = await this.prisma.machine.count({
      where: { companyId, currentStatus: 'Under Maintenance', deletedAt: null },
    });
    const idleMachines = await this.prisma.machine.count({
      where: { companyId, currentStatus: { in: ['Idle', 'Available', 'Returned'] }, deletedAt: null },
    });
    const rentedMachines = await this.prisma.machine.count({
      where: { companyId, ownershipType: { in: ['Rented from Le’Kiray Marketplace', 'Rented Externally'] }, deletedAt: null },
    });
    const ownedMachines = await this.prisma.machine.count({
      where: { companyId, ownershipType: 'Owned', deletedAt: null },
    });
    const utilizationRate = totalMachines > 0 ? (activeMachines / totalMachines) * 100 : 0;

    // 3. Fuel Logs and Costs
    const fuelCostAggregate = await this.prisma.fuelLog.aggregate({
      where: { companyId, usageDate: { gte: firstDayOfMonth }, deletedAt: null },
      _sum: { totalCost: true, litersUsed: true },
    });
    const monthlyFuelCost = fuelCostAggregate._sum.totalCost || 0;
    const monthlyFuelLiters = fuelCostAggregate._sum.litersUsed || 0;

    // Fuel Pending Requests Count
    const pendingRequests = await this.prisma.fuelRequest.count({
      where: { companyId, status: 'Pending', deletedAt: null },
    });

    // Top Fuel Consuming Machine
    const logsForMachine = await this.prisma.fuelLog.groupBy({
      by: ['machineId'],
      where: { companyId, deletedAt: null },
      _sum: { litersUsed: true },
      orderBy: { _sum: { litersUsed: 'desc' } },
      take: 1,
    });
    let topMachineName = 'None';
    if (logsForMachine.length > 0) {
      const topMachine = await this.prisma.machine.findUnique({
        where: { id: logsForMachine[0].machineId },
        select: { brand: true, model: true }
      });
      if (topMachine) {
        topMachineName = `${topMachine.brand} ${topMachine.model}`;
      }
    }

    // Fuel Cost by Project
    const logsForProject = await this.prisma.fuelLog.groupBy({
      by: ['projectId'],
      where: { companyId, deletedAt: null },
      _sum: { totalCost: true },
    });
    const projectCosts = [];
    for (const item of logsForProject) {
      const proj = await this.prisma.project.findUnique({
        where: { id: item.projectId },
        select: { projectName: true }
      });
      if (proj) {
        projectCosts.push({
          projectName: proj.projectName,
          cost: item._sum.totalCost || 0,
        });
      }
    }

    // Fuel Warning Check
    const highFuelUsageWarning = monthlyFuelCost > 50000 
      ? 'Warning: Fuel usage has exceeded the normal monthly threshold of 50,000 ETB.'
      : null;

    // 4. Maintenance Costs
    const maintenanceCostAggregate = await this.prisma.maintenanceRecord.aggregate({
      where: { companyId, startDate: { gte: firstDayOfMonth }, deletedAt: null },
      _sum: { cost: true },
    });
    const monthlyMaintenanceCost = maintenanceCostAggregate._sum.cost || 0;

    const totalMonthlyCost = monthlyFuelCost + monthlyMaintenanceCost;

    // 5. Headcount on Site Today
    const headcountToday = await this.prisma.attendance.count({
      where: {
        companyId,
        date: today,
        status: { in: ['PRESENT', 'LATE'] },
        deletedAt: null,
      },
    });

    const totalEmployees = await this.prisma.employee.count({
      where: { companyId, deletedAt: null },
    });

    // 6. Low Stock items
    const lowStockItems = await this.prisma.inventoryItem.findMany({
      where: {
        companyId,
        deletedAt: null,
        quantity: {
          lte: this.prisma.inventoryItem.fields.minStockAlert,
        },
      },
      include: { warehouse: true },
    });

    // 7. Recent Daily Site Reports (take 5)
    const recentReports = await this.prisma.dailyReport.findMany({
      where: { companyId, deletedAt: null },
      include: {
        project: true,
        site: true,
        submittedBy: true,
      },
      orderBy: { date: 'desc' },
      take: 5,
    });

    // 8. Projects at Risk (any project that had issues logged in reports today/yesterday)
    const recentBlockers = await this.prisma.dailyReport.findMany({
      where: {
        companyId,
        issuesBlockers: { not: '' },
        date: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        deletedAt: null,
      },
      include: { project: true, site: true },
    });

    // 9. Upcoming Maintenance logs
    const activeMaintenance = await this.prisma.maintenanceRecord.findMany({
      where: { companyId, endDate: null, deletedAt: null },
      include: { machine: true },
    });

    // Combined output payload
    return {
      kpis: {
        activeProjects: activeProjectsCount,
        machineryUtilization: {
          rate: Math.round(utilizationRate),
          active: activeMachines,
          idle: idleMachines,
          maintenance: maintenanceMachines,
          total: totalMachines,
          rented: rentedMachines,
          owned: ownedMachines,
        },
        monthlyFuelCost,
        monthlyFuelLiters,
        pendingFuelRequests: pendingRequests,
        topFuelConsumingMachine: topMachineName,
        fuelCostByProject: projectCosts,
        highFuelUsageWarning,
        monthlyMaintenanceCost,
        totalMonthlyCost,
        attendanceToday: {
          present: headcountToday,
          total: totalEmployees,
        },
        lowStockAlertsCount: lowStockItems.length,
      },
      lowStockItems,
      recentReports,
      projectsAtRisk: recentBlockers.map((b) => ({
        id: b.project.id,
        projectName: b.project.projectName,
        siteName: b.site.siteName,
        issue: b.issuesBlockers,
        date: b.date,
      })),
      activeMaintenance,
      marketplaceRequestsCount: 2, // Seeding value for marketplace display
    };
  }
}
