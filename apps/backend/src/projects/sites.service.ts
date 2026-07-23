import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@Injectable()
export class SitesService {
  constructor(private prisma: PrismaService) {}

  async findAllForProject(projectId: string, companyId: string) {
    // Verify project belongs to the company
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId, deletedAt: null },
    });
    if (!project) {
      throw new NotFoundException('Project not found in this company workspace');
    }

    return this.prisma.site.findMany({
      where: { projectId, companyId, deletedAt: null },
      include: {
        siteManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const site = await this.prisma.site.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        project: true,
        siteManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!site) {
      throw new NotFoundException('Site not found in this company workspace');
    }
    return site;
  }

  async create(companyId: string, projectId: string, userId: string, dto: CreateSiteDto) {
    // 1. Verify project exists and belongs to the company
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId, deletedAt: null },
    });
    if (!project) {
      throw new BadRequestException('Project not found in this company workspace');
    }

    // 2. Validate site manager belongs to the same company
    if (dto.siteManagerId) {
      const manager = await this.prisma.user.findFirst({
        where: { id: dto.siteManagerId, companyId, deletedAt: null },
      });
      if (!manager) {
        throw new BadRequestException('Site manager must belong to the same company');
      }
    }

    return this.prisma.site.create({
      data: {
        companyId,
        projectId,
        siteName: dto.siteName,
        location: dto.location,
        gpsLatitude: dto.gpsLatitude || null,
        gpsLongitude: dto.gpsLongitude || null,
        siteManagerId: dto.siteManagerId || null,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        notes: dto.notes || null,
        createdById: userId,
      },
      include: {
        siteManager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async update(id: string, companyId: string, userId: string, dto: UpdateSiteDto) {
    // Verify site exists
    const site = await this.prisma.site.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!site) {
      throw new NotFoundException('Site not found in this company workspace');
    }

    // Validate site manager belongs to the same company
    if (dto.siteManagerId) {
      const manager = await this.prisma.user.findFirst({
        where: { id: dto.siteManagerId, companyId, deletedAt: null },
      });
      if (!manager) {
        throw new BadRequestException('Site manager must belong to the same company');
      }
    }

    return this.prisma.site.update({
      where: { id },
      data: {
        siteName: dto.siteName,
        location: dto.location,
        gpsLatitude: dto.gpsLatitude,
        gpsLongitude: dto.gpsLongitude,
        siteManagerId: dto.siteManagerId,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        notes: dto.notes,
        updatedById: userId,
      },
      include: {
        siteManager: {
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
    // Verify site exists
    const site = await this.prisma.site.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!site) {
      throw new NotFoundException('Site not found in this company workspace');
    }

    // Soft delete site
    return this.prisma.site.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: userId,
      },
    });
  }
}
