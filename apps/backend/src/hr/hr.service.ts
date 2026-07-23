import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  async findAllEmployees(companyId: string) {
    return this.prisma.employee.findMany({
      where: { companyId, deletedAt: null },
      include: {
        site: {
          include: { project: true },
        },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async createEmployee(
    companyId: string,
    data: {
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      role: string;
      siteId?: string;
      createdById?: string;
    },
  ) {
    // Hardening: Verify site belongs to this company
    if (data.siteId) {
      const site = await this.prisma.site.findFirst({
        where: { id: data.siteId, companyId },
      });
      if (!site) {
        throw new BadRequestException('Site not found in this company workspace');
      }
    }

    return this.prisma.employee.create({
      data: {
        companyId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role,
        siteId: data.siteId || null,
        createdById: data.createdById,
      },
    });
  }

  async recordAttendance(
    companyId: string,
    data: {
      employeeId: string;
      date: Date;
      status: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE';
      remarks?: string;
      recordedById: string;
    },
  ) {
    // Hardening: Verify employee belongs to this company
    const employee = await this.prisma.employee.findFirst({
      where: { id: data.employeeId, companyId },
    });
    if (!employee) {
      throw new BadRequestException('Employee not found in this company workspace');
    }

    const normalizedDate = new Date(data.date);
    normalizedDate.setHours(0, 0, 0, 0);

    const existing = await this.prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId: data.employeeId,
          date: normalizedDate,
        },
      },
    });

    if (existing) {
      return this.prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status: data.status,
          remarks: data.remarks,
          recordedById: data.recordedById,
          updatedById: data.recordedById,
        },
      });
    }

    return this.prisma.attendance.create({
      data: {
        companyId,
        employeeId: data.employeeId,
        date: normalizedDate,
        status: data.status,
        remarks: data.remarks,
        recordedById: data.recordedById,
        createdById: data.recordedById,
      },
    });
  }

  async getAttendanceReport(companyId: string, date?: Date) {
    const filterDate = date ? new Date(date) : new Date();
    filterDate.setHours(0, 0, 0, 0);

    return this.prisma.attendance.findMany({
      where: { companyId, date: filterDate, deletedAt: null },
      include: {
        employee: {
          include: { site: true },
        },
        recordedBy: true,
      },
    });
  }
}
