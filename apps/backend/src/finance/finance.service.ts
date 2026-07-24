import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ApproveExpenseDto } from './dto/approve-expense.dto';
import { CreateProjectRevenueDto } from './dto/create-project-revenue.dto';

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  // --- 1. Aggregated Operational Cost Summary ---
  async getSummary(companyId: string) {
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Fuel Cost
    const fuelAgg = await this.prisma.fuelLog.aggregate({
      where: { companyId, usageDate: { gte: firstDayOfMonth }, deletedAt: null },
      _sum: { totalCost: true },
    });
    const monthlyFuelCost = fuelAgg._sum?.totalCost || 0;

    // Inventory Cost
    const inventoryAgg = await this.prisma.stockMovement.aggregate({
      where: { companyId, createdAt: { gte: firstDayOfMonth }, deletedAt: null },
      _sum: { totalCost: true },
    });
    const monthlyInventoryCost = inventoryAgg._sum?.totalCost || 0;

    // Maintenance Cost
    const maintAgg = await this.prisma.maintenanceRecord.aggregate({
      where: { companyId, reportedDate: { gte: firstDayOfMonth }, deletedAt: null },
      _sum: { totalCost: true },
    });
    const monthlyMaintenanceCost = maintAgg._sum?.totalCost || 0;

    // Manual Expenses (excluding rejected/cancelled)
    const expAgg = await this.prisma.expense.aggregate({
      where: {
        companyId,
        expenseDate: { gte: firstDayOfMonth },
        status: { notIn: ['Rejected', 'Cancelled'] },
        deletedAt: null,
      },
      _sum: { amount: true },
    });
    const monthlyManualExpenses = expAgg._sum?.amount || 0;

    // Estimated Labor Cost (this month attendance * dailyRate)
    const attendanceRecords = await this.prisma.attendance.findMany({
      where: {
        companyId,
        date: { gte: firstDayOfMonth },
        status: { in: ['PRESENT', 'LATE'] },
        deletedAt: null,
      },
      include: { employee: true },
    });

    let monthlyLaborCostEstimate = 0;
    for (const att of attendanceRecords) {
      if (att.employee?.dailyRate) {
        monthlyLaborCostEstimate += att.employee.dailyRate;
      } else if (att.employee?.monthlySalary) {
        // Prorate monthly salary assuming 26 working days per month
        monthlyLaborCostEstimate += att.employee.monthlySalary / 26;
      }
    }

    // Estimated Machinery Rental Cost (Active assignments)
    const activeAssignments = await this.prisma.machineAssignment.findMany({
      where: { companyId, deletedAt: null },
      include: { machine: true },
    });

    let monthlyMachineryRentalCost = 0;
    const now = new Date();
    for (const assign of activeAssignments) {
      const start = new Date(assign.startDate);
      const end = assign.endDate ? new Date(assign.endDate) : now;
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));

      if (assign.machine.dailyRentalCost) {
        monthlyMachineryRentalCost += days * assign.machine.dailyRentalCost;
      } else if (assign.machine.hourlyRentalCost) {
        monthlyMachineryRentalCost += (assign.workingHours || days * 8) * assign.machine.hourlyRentalCost;
      }
    }

    const totalOperationalCost =
      monthlyFuelCost +
      monthlyInventoryCost +
      monthlyMaintenanceCost +
      monthlyManualExpenses +
      monthlyLaborCostEstimate +
      monthlyMachineryRentalCost;

    // Highest Cost Project
    const projects = await this.prisma.project.findMany({
      where: { companyId, deletedAt: null },
    });

    let highestCostProject: { id: string; projectName: string; totalCost: number } | null = null;
    let maxCost = -1;

    for (const proj of projects) {
      const projCost = await this.calculateProjectTotalCost(proj.id, companyId);
      if (projCost > maxCost) {
        maxCost = projCost;
        highestCostProject = { id: proj.id, projectName: proj.projectName, totalCost: projCost };
      }
    }

    // Projects over budget count
    let projectsAtRiskCount = 0;
    for (const proj of projects) {
      if (proj.budget > 0) {
        const cost = await this.calculateProjectTotalCost(proj.id, companyId);
        if (cost > proj.budget) {
          projectsAtRiskCount++;
        }
      }
    }

    // Recent Expenses
    const recentExpenses = await this.prisma.expense.findMany({
      where: { companyId, deletedAt: null },
      include: { project: true, site: true, machine: true },
      orderBy: { expenseDate: 'desc' },
      take: 5,
    });

    return {
      monthlyFuelCost,
      monthlyInventoryCost,
      monthlyMaintenanceCost,
      monthlyLaborCostEstimate: Math.round(monthlyLaborCostEstimate * 100) / 100,
      monthlyMachineryRentalCost: Math.round(monthlyMachineryRentalCost * 100) / 100,
      monthlyManualExpenses,
      totalOperationalCost: Math.round(totalOperationalCost * 100) / 100,
      highestCostProject,
      projectsAtRiskCount,
      recentExpenses,
    };
  }

  // --- Helper: Calculate Complete Operational Cost for Single Project ---
  private async calculateProjectTotalCost(projectId: string, companyId: string): Promise<number> {
    const [fuel, inv, maint, exp] = await Promise.all([
      this.prisma.fuelLog.aggregate({
        where: { companyId, projectId, deletedAt: null },
        _sum: { totalCost: true },
      }),
      this.prisma.stockMovement.aggregate({
        where: { companyId, projectId, deletedAt: null },
        _sum: { totalCost: true },
      }),
      this.prisma.maintenanceRecord.aggregate({
        where: { companyId, projectId, deletedAt: null },
        _sum: { totalCost: true },
      }),
      this.prisma.expense.aggregate({
        where: { companyId, projectId, status: { notIn: ['Rejected', 'Cancelled'] }, deletedAt: null },
        _sum: { amount: true },
      }),
    ]);

    const fuelCost = fuel._sum?.totalCost || 0;
    const inventoryCost = inv._sum?.totalCost || 0;
    const maintenanceCost = maint._sum?.totalCost || 0;
    const manualExpenses = exp._sum?.amount || 0;

    // Labor estimate
    const attendance = await this.prisma.attendance.findMany({
      where: { companyId, projectId, status: { in: ['PRESENT', 'LATE'] }, deletedAt: null },
      include: { employee: true },
    });
    let laborCost = 0;
    for (const a of attendance) {
      if (a.employee?.dailyRate) laborCost += a.employee.dailyRate;
      else if (a.employee?.monthlySalary) laborCost += a.employee.monthlySalary / 26;
    }

    // Rental estimate
    const assignments = await this.prisma.machineAssignment.findMany({
      where: { companyId, projectId, deletedAt: null },
      include: { machine: true },
    });
    let rentalCost = 0;
    const now = new Date();
    for (const as of assignments) {
      const start = new Date(as.startDate);
      const end = as.endDate ? new Date(as.endDate) : now;
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
      if (as.machine.dailyRentalCost) rentalCost += days * as.machine.dailyRentalCost;
      else if (as.machine.hourlyRentalCost) rentalCost += (as.workingHours || days * 8) * as.machine.hourlyRentalCost;
    }

    return Math.round((fuelCost + inventoryCost + maintenanceCost + manualExpenses + laborCost + rentalCost) * 100) / 100;
  }

  // --- 2. Cost Breakdown by Project ---
  async getByProject(companyId: string) {
    const projects = await this.prisma.project.findMany({
      where: { companyId, deletedAt: null },
      include: {
        _count: { select: { sites: true, currentMachines: true } },
      },
    });

    const result = [];
    for (const proj of projects) {
      const [fuel, inv, maint, exp, rev] = await Promise.all([
        this.prisma.fuelLog.aggregate({
          where: { companyId, projectId: proj.id, deletedAt: null },
          _sum: { totalCost: true },
        }),
        this.prisma.stockMovement.aggregate({
          where: { companyId, projectId: proj.id, deletedAt: null },
          _sum: { totalCost: true },
        }),
        this.prisma.maintenanceRecord.aggregate({
          where: { companyId, projectId: proj.id, deletedAt: null },
          _sum: { totalCost: true },
        }),
        this.prisma.expense.aggregate({
          where: { companyId, projectId: proj.id, status: { notIn: ['Rejected', 'Cancelled'] }, deletedAt: null },
          _sum: { amount: true },
        }),
        this.prisma.projectRevenue.aggregate({
          where: { companyId, projectId: proj.id, deletedAt: null },
          _sum: { amount: true },
        }),
      ]);

      const fuelCost = fuel._sum?.totalCost || 0;
      const inventoryCost = inv._sum?.totalCost || 0;
      const maintenanceCost = maint._sum?.totalCost || 0;
      const manualExpenses = exp._sum?.amount || 0;
      const revenue = rev._sum?.amount || 0;

      // Labor estimate
      const attendance = await this.prisma.attendance.findMany({
        where: { companyId, projectId: proj.id, status: { in: ['PRESENT', 'LATE'] }, deletedAt: null },
        include: { employee: true },
      });
      let laborCostEstimate = 0;
      for (const a of attendance) {
        if (a.employee?.dailyRate) laborCostEstimate += a.employee.dailyRate;
        else if (a.employee?.monthlySalary) laborCostEstimate += a.employee.monthlySalary / 26;
      }

      // Rental estimate
      const assignments = await this.prisma.machineAssignment.findMany({
        where: { companyId, projectId: proj.id, deletedAt: null },
        include: { machine: true },
      });
      let machineryRentalCost = 0;
      const now = new Date();
      for (const as of assignments) {
        const start = new Date(as.startDate);
        const end = as.endDate ? new Date(as.endDate) : now;
        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)));
        if (as.machine.dailyRentalCost) machineryRentalCost += days * as.machine.dailyRentalCost;
        else if (as.machine.hourlyRentalCost) machineryRentalCost += (as.workingHours || days * 8) * as.machine.hourlyRentalCost;
      }

      const totalCost = Math.round((fuelCost + inventoryCost + maintenanceCost + manualExpenses + laborCostEstimate + machineryRentalCost) * 100) / 100;
      const budgetVariance = proj.budget - totalCost;
      const costRiskStatus = proj.budget > 0 && totalCost > proj.budget ? 'Over Budget' : proj.budget > 0 && totalCost > proj.budget * 0.85 ? 'Near Budget Limit' : 'On Track';

      result.push({
        project: {
          id: proj.id,
          projectName: proj.projectName,
          projectCode: proj.projectCode,
          clientName: proj.clientName,
          budget: proj.budget,
          status: proj.status,
          siteCount: proj._count.sites,
        },
        fuelCost,
        inventoryCost,
        maintenanceCost,
        laborCostEstimate: Math.round(laborCostEstimate * 100) / 100,
        machineryRentalCost: Math.round(machineryRentalCost * 100) / 100,
        manualExpenses,
        totalCost,
        revenue,
        budgetVariance,
        costRiskStatus,
      });
    }

    return result;
  }

  // --- 3. Cost Breakdown by Site ---
  async getBySite(companyId: string) {
    const sites = await this.prisma.site.findMany({
      where: { companyId, deletedAt: null },
      include: { project: true },
    });

    const result = [];
    for (const site of sites) {
      const [fuel, inv, maint, exp] = await Promise.all([
        this.prisma.fuelLog.aggregate({
          where: { companyId, siteId: site.id, deletedAt: null },
          _sum: { totalCost: true },
        }),
        this.prisma.stockMovement.aggregate({
          where: { companyId, siteId: site.id, deletedAt: null },
          _sum: { totalCost: true },
        }),
        this.prisma.maintenanceRecord.aggregate({
          where: { companyId, siteId: site.id, deletedAt: null },
          _sum: { totalCost: true },
        }),
        this.prisma.expense.aggregate({
          where: { companyId, siteId: site.id, status: { notIn: ['Rejected', 'Cancelled'] }, deletedAt: null },
          _sum: { amount: true },
        }),
      ]);

      const fuelCost = fuel._sum?.totalCost || 0;
      const inventoryCost = inv._sum?.totalCost || 0;
      const maintenanceCost = maint._sum?.totalCost || 0;
      const manualExpenses = exp._sum?.amount || 0;

      const totalCost = Math.round((fuelCost + inventoryCost + maintenanceCost + manualExpenses) * 100) / 100;

      result.push({
        site: {
          id: site.id,
          siteName: site.siteName,
          project: site.project ? { id: site.project.id, projectName: site.project.projectName } : null,
        },
        fuelCost,
        inventoryCost,
        maintenanceCost,
        manualExpenses,
        totalCost,
      });
    }

    return result;
  }

  // --- 4. Cost Breakdown by Heavy Machine Asset ---
  async getByMachine(companyId: string) {
    const machines = await this.prisma.machine.findMany({
      where: { companyId, deletedAt: null },
      include: { currentProject: true, currentSite: true },
    });

    const result = [];
    for (const m of machines) {
      const [fuel, maint, exp] = await Promise.all([
        this.prisma.fuelLog.aggregate({
          where: { companyId, machineId: m.id, deletedAt: null },
          _sum: { totalCost: true },
        }),
        this.prisma.maintenanceRecord.aggregate({
          where: { companyId, machineId: m.id, deletedAt: null },
          _sum: { totalCost: true },
        }),
        this.prisma.expense.aggregate({
          where: { companyId, machineId: m.id, status: { notIn: ['Rejected', 'Cancelled'] }, deletedAt: null },
          _sum: { amount: true },
        }),
      ]);

      const fuelCost = fuel._sum?.totalCost || 0;
      const maintenanceCost = maint._sum?.totalCost || 0;
      const manualExpenses = exp._sum?.amount || 0;
      const totalCost = Math.round((fuelCost + maintenanceCost + manualExpenses) * 100) / 100;

      result.push({
        machine: {
          id: m.id,
          brand: m.brand,
          model: m.model,
          plateNumber: m.plateNumber,
          machineType: m.machineType,
          currentStatus: m.currentStatus,
          currentProjectName: m.currentProject?.projectName,
        },
        fuelCost,
        maintenanceCost,
        manualExpenses,
        totalCost,
      });
    }

    return result;
  }

  // --- 5. Overall Cost Category Breakdown ---
  async getCostBreakdown(companyId: string) {
    const expenses = await this.prisma.expense.groupBy({
      by: ['expenseCategory'],
      where: { companyId, status: { notIn: ['Rejected', 'Cancelled'] }, deletedAt: null },
      _sum: { amount: true },
    });

    const categoriesMap: Record<string, number> = {};
    for (const exp of expenses) {
      categoriesMap[exp.expenseCategory] = exp._sum.amount || 0;
    }

    const [fuel, inv, maint] = await Promise.all([
      this.prisma.fuelLog.aggregate({
        where: { companyId, deletedAt: null },
        _sum: { totalCost: true },
      }),
      this.prisma.stockMovement.aggregate({
        where: { companyId, deletedAt: null },
        _sum: { totalCost: true },
      }),
      this.prisma.maintenanceRecord.aggregate({
        where: { companyId, deletedAt: null },
        _sum: { totalCost: true },
      }),
    ]);

    categoriesMap['Fuel (System Logged)'] = fuel._sum?.totalCost || 0;
    categoriesMap['Inventory / Materials (System Issued)'] = inv._sum?.totalCost || 0;
    categoriesMap['Maintenance (System Logged)'] = maint._sum?.totalCost || 0;

    return Object.entries(categoriesMap).map(([category, totalCost]) => ({
      category,
      totalCost: Math.round(totalCost * 100) / 100,
    }));
  }

  // --- 6. Project Profitability Estimator ---
  async getProjectProfitability(companyId: string) {
    const projectsCost = await this.getByProject(companyId);

    return projectsCost.map((item) => {
      const revenue = item.revenue > 0 ? item.revenue : item.project.budget;
      const estimatedGrossMargin = revenue - item.totalCost;
      const grossMarginPercentage = revenue > 0 ? Math.round((estimatedGrossMargin / revenue) * 1000) / 10 : 0;

      return {
        project: item.project,
        contractRevenueValue: revenue,
        totalEstimatedCost: item.totalCost,
        estimatedGrossMargin,
        grossMarginPercentage,
        costRiskStatus: item.costRiskStatus,
        disclaimer: 'Operational estimate only. Not formal accounting or tax reporting.',
      };
    });
  }

  // --- 7. Single Project Cost Detail ---
  async getProjectDetailReport(projectId: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId, deletedAt: null },
      include: { sites: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${projectId}" not found`);
    }

    const [fuelLogs, stockMovements, maintenanceRecords, expenses, revenues] = await Promise.all([
      this.prisma.fuelLog.findMany({
        where: { companyId, projectId, deletedAt: null },
        include: { machine: true, site: true },
        orderBy: { usageDate: 'desc' },
        take: 10,
      }),
      this.prisma.stockMovement.findMany({
        where: { companyId, projectId, deletedAt: null },
        include: { inventoryItem: true, site: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.maintenanceRecord.findMany({
        where: { companyId, projectId, deletedAt: null },
        include: { machine: true },
        orderBy: { reportedDate: 'desc' },
        take: 10,
      }),
      this.prisma.expense.findMany({
        where: { companyId, projectId, deletedAt: null },
        include: { site: true, machine: true },
        orderBy: { expenseDate: 'desc' },
        take: 10,
      }),
      this.prisma.projectRevenue.findMany({
        where: { companyId, projectId, deletedAt: null },
        orderBy: { revenueDate: 'desc' },
      }),
    ]);

    const projectCostSummary = (await this.getByProject(companyId)).find((p) => p.project.id === projectId);

    return {
      project,
      summary: projectCostSummary,
      fuelLogs,
      stockMovements,
      maintenanceRecords,
      expenses,
      revenues,
    };
  }

  // --- 8. Manual Expense CRUD ---
  async findAllExpenses(
    companyId: string,
    filters?: {
      search?: string;
      projectId?: string;
      siteId?: string;
      machineId?: string;
      category?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: any = { companyId, deletedAt: null };

    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.siteId) where.siteId = filters.siteId;
    if (filters?.machineId) where.machineId = filters.machineId;
    if (filters?.category) where.expenseCategory = filters.category;
    if (filters?.status) where.status = filters.status;

    if (filters?.startDate || filters?.endDate) {
      where.expenseDate = {};
      if (filters.startDate) where.expenseDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.expenseDate.lte = new Date(filters.endDate);
    }

    if (filters?.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { vendorName: { contains: filters.search, mode: 'insensitive' } },
        { referenceNumber: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.expense.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        site: { select: { id: true, siteName: true } },
        machine: { select: { id: true, brand: true, model: true, plateNumber: true } },
        recordedBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });
  }

  async createExpense(companyId: string, userId: string, dto: CreateExpenseDto) {
    if (dto.projectId) {
      const proj = await this.prisma.project.findFirst({
        where: { id: dto.projectId, companyId, deletedAt: null },
      });
      if (!proj) throw new BadRequestException(`Project "${dto.projectId}" not found`);
    }

    if (dto.siteId) {
      const site = await this.prisma.site.findFirst({
        where: { id: dto.siteId, companyId, deletedAt: null },
      });
      if (!site) throw new BadRequestException(`Site "${dto.siteId}" not found`);
      if (dto.projectId && site.projectId !== dto.projectId) {
        throw new BadRequestException(`Site "${dto.siteId}" does not belong to selected project`);
      }
    }

    if (dto.machineId) {
      const machine = await this.prisma.machine.findFirst({
        where: { id: dto.machineId, companyId, deletedAt: null },
      });
      if (!machine) throw new BadRequestException(`Machine "${dto.machineId}" not found`);
    }

    return this.prisma.expense.create({
      data: {
        companyId,
        projectId: dto.projectId || null,
        siteId: dto.siteId || null,
        machineId: dto.machineId || null,
        expenseCategory: dto.expenseCategory,
        expenseType: dto.expenseType || null,
        amount: dto.amount,
        currency: dto.currency || 'ETB',
        expenseDate: new Date(dto.expenseDate),
        description: dto.description || null,
        vendorName: dto.vendorName || null,
        receiptUrl: dto.receiptUrl || null,
        referenceNumber: dto.referenceNumber || null,
        status: dto.status || 'Recorded',
        notes: dto.notes || null,
        recordedById: userId,
        createdById: userId,
      },
      include: { project: true, site: true, machine: true, recordedBy: true },
    });
  }

  async findOneExpense(id: string, companyId: string) {
    const exp = await this.prisma.expense.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        project: true,
        site: true,
        machine: true,
        recordedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    if (!exp) throw new NotFoundException(`Expense record with ID "${id}" not found`);
    return exp;
  }

  async updateExpense(id: string, companyId: string, userId: string, dto: UpdateExpenseDto) {
    await this.findOneExpense(id, companyId);

    return this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.projectId !== undefined && { projectId: dto.projectId || null }),
        ...(dto.siteId !== undefined && { siteId: dto.siteId || null }),
        ...(dto.machineId !== undefined && { machineId: dto.machineId || null }),
        ...(dto.expenseCategory && { expenseCategory: dto.expenseCategory }),
        ...(dto.expenseType !== undefined && { expenseType: dto.expenseType || null }),
        ...(dto.amount !== undefined && { amount: dto.amount }),
        ...(dto.currency && { currency: dto.currency }),
        ...(dto.expenseDate && { expenseDate: new Date(dto.expenseDate) }),
        ...(dto.description !== undefined && { description: dto.description || null }),
        ...(dto.vendorName !== undefined && { vendorName: dto.vendorName || null }),
        ...(dto.receiptUrl !== undefined && { receiptUrl: dto.receiptUrl || null }),
        ...(dto.referenceNumber !== undefined && { referenceNumber: dto.referenceNumber || null }),
        ...(dto.status && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes || null }),
        updatedById: userId,
      },
      include: { project: true, site: true, machine: true },
    });
  }

  async approveExpense(id: string, companyId: string, userId: string, dto: ApproveExpenseDto) {
    await this.findOneExpense(id, companyId);

    return this.prisma.expense.update({
      where: { id },
      data: {
        status: dto.status || 'Approved',
        approvedById: userId,
        notes: dto.notes ? dto.notes : undefined,
        updatedById: userId,
      },
      include: { project: true, site: true, machine: true, approvedBy: true },
    });
  }

  async deleteExpense(id: string, companyId: string) {
    await this.findOneExpense(id, companyId);

    return this.prisma.expense.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // --- 9. Project Revenue Entry CRUD ---
  async createProjectRevenue(companyId: string, userId: string, dto: CreateProjectRevenueDto) {
    const proj = await this.prisma.project.findFirst({
      where: { id: dto.projectId, companyId, deletedAt: null },
    });
    if (!proj) throw new BadRequestException(`Project "${dto.projectId}" not found`);

    return this.prisma.projectRevenue.create({
      data: {
        companyId,
        projectId: dto.projectId,
        amount: dto.amount,
        currency: dto.currency || 'ETB',
        revenueDate: new Date(dto.revenueDate),
        description: dto.description || null,
        clientName: dto.clientName || null,
        invoiceNumber: dto.invoiceNumber || null,
        status: dto.status || 'Recorded',
        recordedById: userId,
      },
      include: { project: true },
    });
  }

  // --- 10. Monthly Financial Report ---
  async getMonthlyReport(companyId: string) {
    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });

      const [fuel, inv, maint, exp] = await Promise.all([
        this.prisma.fuelLog.aggregate({
          where: { companyId, usageDate: { gte: d, lt: nextD }, deletedAt: null },
          _sum: { totalCost: true },
        }),
        this.prisma.stockMovement.aggregate({
          where: { companyId, createdAt: { gte: d, lt: nextD }, deletedAt: null },
          _sum: { totalCost: true },
        }),
        this.prisma.maintenanceRecord.aggregate({
          where: { companyId, reportedDate: { gte: d, lt: nextD }, deletedAt: null },
          _sum: { totalCost: true },
        }),
        this.prisma.expense.aggregate({
          where: { companyId, expenseDate: { gte: d, lt: nextD }, status: { notIn: ['Rejected', 'Cancelled'] }, deletedAt: null },
          _sum: { amount: true },
        }),
      ]);

      const fuelCost = fuel._sum?.totalCost || 0;
      const inventoryCost = inv._sum?.totalCost || 0;
      const maintenanceCost = maint._sum?.totalCost || 0;
      const manualExpenses = exp._sum?.amount || 0;
      const totalCost = Math.round((fuelCost + inventoryCost + maintenanceCost + manualExpenses) * 100) / 100;

      months.push({
        month: monthLabel,
        fuelCost,
        inventoryCost,
        maintenanceCost,
        manualExpenses,
        totalCost,
      });
    }

    return months;
  }
}
