import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll(companyId: string) {
    return this.prisma.project.findMany({
      where: { companyId, deletedAt: null },
      include: {
        sites: {
          where: { deletedAt: null },
        },
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        sites: {
          where: { deletedAt: null },
          include: {
            siteManager: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        machineAssignments: {
          where: { deletedAt: null },
          include: { machine: true },
        },
        dailyReports: {
          where: { deletedAt: null },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found in this company workspace');
    }
    return project;
  }

  async create(companyId: string, userId: string, dto: CreateProjectDto) {
    // 1. Validate dates: End date cannot be before start date
    if (dto.startDate && dto.endDate) {
      const start = new Date(dto.startDate);
      const end = new Date(dto.endDate);
      if (end < start) {
        throw new BadRequestException('End date cannot be before start date');
      }
    }

    // 2. Validate manager belongs to the same company
    if (dto.projectManagerId) {
      const manager = await this.prisma.user.findFirst({
        where: { id: dto.projectManagerId, companyId, deletedAt: null },
      });
      if (!manager) {
        throw new BadRequestException('Project manager must belong to the same company');
      }
    }

    return this.prisma.project.create({
      data: {
        companyId,
        projectName: dto.projectName,
        projectCode: dto.projectCode || null,
        clientName: dto.clientName || null,
        location: dto.location,
        regionOrCity: dto.regionOrCity || null,
        status: dto.status,
        progressPercentage: dto.progressPercentage ?? 0,
        budget: dto.budget ?? 0,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        projectManagerId: dto.projectManagerId || null,
        description: dto.description || null,
        createdById: userId,
      },
      include: {
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async update(id: string, companyId: string, userId: string, dto: UpdateProjectDto) {
    // Verify project exists
    const project = await this.prisma.project.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException('Project not found in this company workspace');
    }

    // 1. Validate dates: End date cannot be before start date
    const startVal = dto.startDate ? new Date(dto.startDate) : project.startDate;
    const endVal = dto.endDate ? new Date(dto.endDate) : project.endDate;
    if (startVal && endVal && new Date(endVal) < new Date(startVal)) {
      throw new BadRequestException('End date cannot be before start date');
    }

    // 2. Validate manager belongs to the same company
    if (dto.projectManagerId) {
      const manager = await this.prisma.user.findFirst({
        where: { id: dto.projectManagerId, companyId, deletedAt: null },
      });
      if (!manager) {
        throw new BadRequestException('Project manager must belong to the same company');
      }
    }

    return this.prisma.project.update({
      where: { id },
      data: {
        projectName: dto.projectName,
        projectCode: dto.projectCode,
        clientName: dto.clientName,
        location: dto.location,
        regionOrCity: dto.regionOrCity,
        status: dto.status,
        progressPercentage: dto.progressPercentage,
        budget: dto.budget,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        projectManagerId: dto.projectManagerId,
        description: dto.description,
        updatedById: userId,
      },
      include: {
        projectManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async remove(id: string, companyId: string, userId: string) {
    // Verify project exists
    const project = await this.prisma.project.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException('Project not found in this company workspace');
    }

    // Cascade Soft delete sites
    await this.prisma.site.updateMany({
      where: { projectId: id, companyId, deletedAt: null },
      data: {
        deletedAt: new Date(),
        updatedById: userId,
      },
    });

    // Soft delete project
    return this.prisma.project.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: userId,
      },
    });
  }

  async findCompanyUsers(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: { firstName: 'asc' },
    });
  }
}
