import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    companyId: string,
    query?: {
      search?: string;
      projectId?: string;
      siteId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: any = {
      companyId,
      deletedAt: null,
    };

    if (query?.projectId && query.projectId !== 'ALL') {
      where.projectId = query.projectId;
    }
    if (query?.siteId && query.siteId !== 'ALL') {
      where.siteId = query.siteId;
    }
    if (query?.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query?.startDate || query?.endDate) {
      where.reportDate = {};
      if (query.startDate) where.reportDate.gte = new Date(query.startDate);
      if (query.endDate) where.reportDate.lte = new Date(query.endDate);
    }
    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { workCompleted: { contains: s, mode: 'insensitive' } },
        { issuesOrBlockers: { contains: s, mode: 'insensitive' } },
        { safetyIncidents: { contains: s, mode: 'insensitive' } },
        { project: { projectName: { contains: s, mode: 'insensitive' } } },
        { site: { siteName: { contains: s, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.dailyReport.findMany({
      where,
      include: {
        project: { select: { id: true, projectName: true, projectCode: true } },
        site: { select: { id: true, siteName: true, location: true } },
        submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        machineryRecords: {
          where: { deletedAt: null },
          include: { machine: true, operator: true },
        },
        materialRecords: {
          where: { deletedAt: null },
          include: { inventoryItem: true },
        },
        workerRecords: {
          where: { deletedAt: null },
          include: { employee: true },
        },
      },
      orderBy: { reportDate: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const report = await this.prisma.dailyReport.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        project: true,
        site: true,
        submittedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        machineryRecords: {
          where: { deletedAt: null },
          include: { machine: true, operator: true },
        },
        materialRecords: {
          where: { deletedAt: null },
          include: { inventoryItem: true },
        },
        workerRecords: {
          where: { deletedAt: null },
          include: { employee: true },
        },
        photoRecords: { where: { deletedAt: null } },
      },
    });

    if (!report) {
      throw new NotFoundException(`Daily site report with ID "${id}" not found`);
    }

    return report;
  }

  async createReport(companyId: string, userId: string, dto: CreateDailyReportDto) {
    // 1. Verify project
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, companyId, deletedAt: null },
    });
    if (!project) {
      throw new BadRequestException('Project not found in this company workspace');
    }

    // 2. Verify site belongs to project and company
    const site = await this.prisma.site.findFirst({
      where: { id: dto.siteId, projectId: dto.projectId, companyId, deletedAt: null },
    });
    if (!site) {
      throw new BadRequestException('Site not found in this project and company workspace');
    }

    const reportDate = new Date(dto.reportDate);
    reportDate.setHours(0, 0, 0, 0);

    const targetStatus = dto.status || 'Submitted';

    // 3. Block duplicate submitted/approved report for same site & date
    const existingReports = await this.prisma.dailyReport.findMany({
      where: {
        companyId,
        projectId: dto.projectId,
        siteId: dto.siteId,
        reportDate,
        deletedAt: null,
      },
    });

    if (targetStatus !== 'Draft') {
      const activeSubmitted = existingReports.find((r) => r.status !== 'Draft' && r.status !== 'Cancelled');
      if (activeSubmitted) {
        throw new BadRequestException(
          `A daily report (${activeSubmitted.status}) already exists for ${site.siteName} on ${reportDate.toISOString().slice(0, 10)}`,
        );
      }
    } else {
      // Draft duplicate allowed only if same creator
      const existingDraft = existingReports.find((r) => r.status === 'Draft' && r.createdById !== userId);
      if (existingDraft) {
        throw new BadRequestException('A draft report created by another user already exists for this site and date');
      }
    }

    const photosJson = dto.photos ? JSON.stringify(dto.photos) : null;
    const docsJson = dto.documents ? JSON.stringify(dto.documents) : null;

    const report = await this.prisma.dailyReport.create({
      data: {
        companyId,
        projectId: dto.projectId,
        siteId: dto.siteId,
        date: reportDate,
        reportDate,
        submittedById: userId,
        status: targetStatus,
        weatherCondition: dto.weatherCondition || 'Sunny',
        workCompleted: dto.workCompleted,
        workPlannedTomorrow: dto.workPlannedTomorrow,
        issuesOrBlockers: dto.issuesOrBlockers,
        safetyIncidents: dto.safetyIncidents,
        qualityIssues: dto.qualityIssues,
        generalNotes: dto.generalNotes,
        workersPresent: dto.workersPresent ?? 0,
        workersAbsent: dto.workersAbsent ?? 0,
        totalRegularHours: dto.totalRegularHours ?? 0,
        totalOvertimeHours: dto.totalOvertimeHours ?? 0,
        machineryUsedCount: dto.machineryUsedCount ?? (dto.machineryRecords ? dto.machineryRecords.length : 0),
        fuelUsedLiters: dto.fuelUsedLiters ?? 0,
        materialsUsedValue: dto.materialsUsedValue ?? 0,
        photos: photosJson,
        documents: docsJson,
        submittedAt: targetStatus === 'Submitted' ? new Date() : null,
        createdById: userId,
      },
    });

    // Handle machinery detail records
    if (dto.machineryRecords && dto.machineryRecords.length > 0) {
      for (const m of dto.machineryRecords) {
        await this.prisma.dailyReportMachinery.create({
          data: {
            companyId,
            dailyReportId: report.id,
            machineId: m.machineId,
            operatorId: m.operatorId || null,
            workingHours: m.workingHours || 0,
            idleHours: m.idleHours || 0,
            fuelUsedLiters: m.fuelUsedLiters || 0,
            notes: m.notes,
          },
        });
      }
    }

    // Handle material detail records
    if (dto.materialRecords && dto.materialRecords.length > 0) {
      for (const mat of dto.materialRecords) {
        await this.prisma.dailyReportMaterial.create({
          data: {
            companyId,
            dailyReportId: report.id,
            inventoryItemId: mat.inventoryItemId,
            quantityUsed: mat.quantityUsed,
            unit: mat.unit,
            estimatedCost: mat.estimatedCost || 0,
            notes: mat.notes,
          },
        });
      }
    }

    // Handle worker detail records
    if (dto.workerRecords && dto.workerRecords.length > 0) {
      for (const w of dto.workerRecords) {
        await this.prisma.dailyReportWorker.create({
          data: {
            companyId,
            dailyReportId: report.id,
            employeeId: w.employeeId,
            attendanceStatus: w.attendanceStatus || 'Present',
            regularHours: w.regularHours || 8,
            overtimeHours: w.overtimeHours || 0,
            notes: w.notes,
          },
        });
      }
    }

    return this.findOne(report.id, companyId);
  }

  async updateReport(id: string, companyId: string, userId: string, dto: UpdateDailyReportDto) {
    const report = await this.findOne(id, companyId);

    if (report.status === 'Approved') {
      throw new ForbiddenException('Approved daily site reports are locked and read-only.');
    }

    const photosJson = dto.photos ? JSON.stringify(dto.photos) : report.photos;
    const docsJson = dto.documents ? JSON.stringify(dto.documents) : report.documents;

    const reportDate = dto.reportDate ? new Date(dto.reportDate) : report.reportDate;
    reportDate.setHours(0, 0, 0, 0);

    await this.prisma.dailyReport.update({
      where: { id: report.id },
      data: {
        projectId: dto.projectId || report.projectId,
        siteId: dto.siteId || report.siteId,
        date: reportDate,
        reportDate,
        status: dto.status || report.status,
        weatherCondition: dto.weatherCondition || report.weatherCondition,
        workCompleted: dto.workCompleted || report.workCompleted,
        workPlannedTomorrow: dto.workPlannedTomorrow !== undefined ? dto.workPlannedTomorrow : report.workPlannedTomorrow,
        issuesOrBlockers: dto.issuesOrBlockers !== undefined ? dto.issuesOrBlockers : report.issuesOrBlockers,
        safetyIncidents: dto.safetyIncidents !== undefined ? dto.safetyIncidents : report.safetyIncidents,
        qualityIssues: dto.qualityIssues !== undefined ? dto.qualityIssues : report.qualityIssues,
        generalNotes: dto.generalNotes !== undefined ? dto.generalNotes : report.generalNotes,
        workersPresent: dto.workersPresent !== undefined ? dto.workersPresent : report.workersPresent,
        workersAbsent: dto.workersAbsent !== undefined ? dto.workersAbsent : report.workersAbsent,
        totalRegularHours: dto.totalRegularHours !== undefined ? dto.totalRegularHours : report.totalRegularHours,
        totalOvertimeHours: dto.totalOvertimeHours !== undefined ? dto.totalOvertimeHours : report.totalOvertimeHours,
        machineryUsedCount: dto.machineryUsedCount !== undefined ? dto.machineryUsedCount : report.machineryUsedCount,
        fuelUsedLiters: dto.fuelUsedLiters !== undefined ? dto.fuelUsedLiters : report.fuelUsedLiters,
        materialsUsedValue: dto.materialsUsedValue !== undefined ? dto.materialsUsedValue : report.materialsUsedValue,
        photos: photosJson,
        documents: docsJson,
        updatedById: userId,
      },
    });

    return this.findOne(report.id, companyId);
  }

  async deleteReport(id: string, companyId: string) {
    const report = await this.findOne(id, companyId);

    await this.prisma.dailyReport.update({
      where: { id: report.id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Daily report soft-deleted successfully', id };
  }

  async submitReport(id: string, companyId: string, userId: string) {
    const report = await this.findOne(id, companyId);

    if (report.status !== 'Draft' && report.status !== 'Rejected') {
      throw new BadRequestException(`Cannot submit a daily report with status "${report.status}"`);
    }

    await this.prisma.dailyReport.update({
      where: { id: report.id },
      data: {
        status: 'Submitted',
        submittedAt: new Date(),
        updatedById: userId,
      },
    });

    return this.findOne(report.id, companyId);
  }

  async approveReport(id: string, companyId: string, userId: string, approvalNotes?: string) {
    const report = await this.findOne(id, companyId);

    if (report.status !== 'Submitted') {
      throw new BadRequestException(`Only submitted daily reports can be approved. Current status: "${report.status}"`);
    }

    await this.prisma.dailyReport.update({
      where: { id: report.id },
      data: {
        status: 'Approved',
        approvedById: userId,
        approvedAt: new Date(),
        generalNotes: approvalNotes ? `${report.generalNotes || ''}\nApproval Notes: ${approvalNotes}` : report.generalNotes,
        updatedById: userId,
      },
    });

    return this.findOne(report.id, companyId);
  }

  async rejectReport(id: string, companyId: string, userId: string, rejectionReason: string) {
    const report = await this.findOne(id, companyId);

    if (report.status !== 'Submitted') {
      throw new BadRequestException(`Only submitted daily reports can be rejected. Current status: "${report.status}"`);
    }

    if (!rejectionReason || !rejectionReason.trim()) {
      throw new BadRequestException('Rejection reason is required');
    }

    await this.prisma.dailyReport.update({
      where: { id: report.id },
      data: {
        status: 'Rejected',
        rejectedAt: new Date(),
        rejectionReason,
        updatedById: userId,
      },
    });

    return this.findOne(report.id, companyId);
  }

  async findByProject(projectId: string, companyId: string) {
    return this.findAll(companyId, { projectId });
  }

  async findBySite(siteId: string, companyId: string) {
    return this.findAll(companyId, { siteId });
  }

  async getTodayStatus(companyId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeSites = await this.prisma.site.findMany({
      where: { companyId, status: 'Active', deletedAt: null },
      include: {
        project: { select: { id: true, projectName: true } },
        siteManager: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    const todayReports = await this.prisma.dailyReport.findMany({
      where: {
        companyId,
        reportDate: today,
        deletedAt: null,
      },
      include: {
        project: true,
        site: true,
        submittedBy: true,
      },
    });

    const sitesWithReport = new Set(todayReports.map((r) => r.siteId));

    const siteStatus = activeSites.map((site) => {
      const report = todayReports.find((r) => r.siteId === site.id);
      return {
        siteId: site.id,
        siteName: site.siteName,
        projectId: site.projectId,
        projectName: site.project?.projectName,
        siteManager: site.siteManager ? `${site.siteManager.firstName} ${site.siteManager.lastName}` : 'Unassigned',
        hasSubmittedToday: !!report,
        reportId: report?.id,
        status: report?.status || 'Missing',
        issuesOrBlockers: report?.issuesOrBlockers,
        safetyIncidents: report?.safetyIncidents,
      };
    });

    const submittedCount = todayReports.filter((r) => r.status !== 'Draft' && r.status !== 'Cancelled').length;
    const missingCount = activeSites.length - submittedCount;
    const reportsWithBlockers = todayReports.filter((r) => r.issuesOrBlockers && r.issuesOrBlockers.trim().length > 0);
    const reportsWithSafety = todayReports.filter((r) => r.safetyIncidents && r.safetyIncidents.trim().length > 0);

    return {
      date: today.toISOString().slice(0, 10),
      totalActiveSites: activeSites.length,
      submittedCount,
      missingCount: Math.max(0, missingCount),
      blockersCount: reportsWithBlockers.length,
      safetyIncidentsCount: reportsWithSafety.length,
      sites: siteStatus,
    };
  }

  async getSummaryStats(companyId: string) {
    const reports = await this.prisma.dailyReport.findMany({
      where: { companyId, deletedAt: null },
    });

    const totalReports = reports.length;
    const submittedCount = reports.filter((r) => r.status === 'Submitted').length;
    const approvedCount = reports.filter((r) => r.status === 'Approved').length;
    const rejectedCount = reports.filter((r) => r.status === 'Rejected').length;
    const draftCount = reports.filter((r) => r.status === 'Draft').length;

    const totalFuelUsed = reports.reduce((acc, r) => acc + (r.fuelUsedLiters || r.fuelUsed || 0), 0);
    const totalMaterialValue = reports.reduce((acc, r) => acc + (r.materialsUsedValue || 0), 0);

    const reportsWithBlockers = reports.filter((r) => r.issuesOrBlockers && r.issuesOrBlockers.trim().length > 0);
    const reportsWithSafety = reports.filter((r) => r.safetyIncidents && r.safetyIncidents.trim().length > 0);

    return {
      totalReports,
      submittedCount,
      approvedCount,
      rejectedCount,
      draftCount,
      totalFuelUsedLiters: Math.round(totalFuelUsed * 100) / 100,
      totalMaterialValue: Math.round(totalMaterialValue * 100) / 100,
      blockerReportsCount: reportsWithBlockers.length,
      safetyIncidentsCount: reportsWithSafety.length,
    };
  }
}
