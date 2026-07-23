import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.dailyReport.findMany({
      where: { companyId, deletedAt: null },
      include: {
        project: true,
        site: true,
        submittedBy: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async createReport(
    companyId: string,
    data: {
      projectId: string;
      siteId: string;
      date: Date;
      workCompleted: string;
      machineryUsed?: string;
      workersPresent: number;
      materialsUsed?: string;
      fuelUsed?: number;
      issuesBlockers?: string;
      photos?: string[];
      submittedById: string;
    },
  ) {
    // 1. Verify project
    const project = await this.prisma.project.findFirst({
      where: { id: data.projectId, companyId },
    });
    if (!project) {
      throw new BadRequestException('Project not found in this company workspace');
    }

    // 2. Verify site belongs to project and company
    const site = await this.prisma.site.findFirst({
      where: { id: data.siteId, projectId: data.projectId, companyId },
    });
    if (!site) {
      throw new BadRequestException('Site not found in this project and company workspace');
    }

    const normalizedDate = new Date(data.date);
    normalizedDate.setHours(0, 0, 0, 0);

    const existing = await this.prisma.dailyReport.findUnique({
      where: {
        siteId_date: {
          siteId: data.siteId,
          date: normalizedDate,
        },
      },
    });

    if (existing) {
      return this.prisma.dailyReport.update({
        where: { id: existing.id },
        data: {
          workCompleted: data.workCompleted,
          machineryUsed: data.machineryUsed,
          workersPresent: data.workersPresent,
          materialsUsed: data.materialsUsed,
          fuelUsed: data.fuelUsed,
          issuesBlockers: data.issuesBlockers,
          photos: data.photos ? JSON.stringify(data.photos) : undefined,
          submittedById: data.submittedById,
          updatedById: data.submittedById,
        },
      });
    }

    return this.prisma.dailyReport.create({
      data: {
        companyId,
        projectId: data.projectId,
        siteId: data.siteId,
        date: normalizedDate,
        workCompleted: data.workCompleted,
        machineryUsed: data.machineryUsed,
        workersPresent: data.workersPresent,
        materialsUsed: data.materialsUsed,
        fuelUsed: data.fuelUsed,
        issuesBlockers: data.issuesBlockers,
        photos: data.photos ? JSON.stringify(data.photos) : undefined,
        submittedById: data.submittedById,
        createdById: data.submittedById,
      },
    });
  }
}
