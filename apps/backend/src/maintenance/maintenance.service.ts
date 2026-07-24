import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { StartMaintenanceDto } from './dto/start-maintenance.dto';
import { CompleteMaintenanceDto } from './dto/complete-maintenance.dto';
import { CancelMaintenanceDto } from './dto/cancel-maintenance.dto';
import { AddMaintenancePartDto } from './dto/add-maintenance-part.dto';

@Injectable()
export class MaintenanceService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    companyId: string,
    query?: {
      search?: string;
      machineId?: string;
      projectId?: string;
      siteId?: string;
      status?: string;
      priority?: string;
      maintenanceType?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const where: any = {
      companyId,
      deletedAt: null,
    };

    if (query?.machineId && query.machineId !== 'ALL') {
      where.machineId = query.machineId;
    }
    if (query?.projectId && query.projectId !== 'ALL') {
      where.projectId = query.projectId;
    }
    if (query?.siteId && query.siteId !== 'ALL') {
      where.siteId = query.siteId;
    }
    if (query?.status && query.status !== 'ALL') {
      where.status = query.status;
    }
    if (query?.priority && query.priority !== 'ALL') {
      where.priority = query.priority;
    }
    if (query?.maintenanceType && query.maintenanceType !== 'ALL') {
      where.maintenanceType = query.maintenanceType;
    }
    if (query?.startDate || query?.endDate) {
      where.reportedDate = {};
      if (query.startDate) where.reportedDate.gte = new Date(query.startDate);
      if (query.endDate) where.reportedDate.lte = new Date(query.endDate);
    }
    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { issueTitle: { contains: s, mode: 'insensitive' } },
        { issueDescription: { contains: s, mode: 'insensitive' } },
        { diagnosis: { contains: s, mode: 'insensitive' } },
        { workPerformed: { contains: s, mode: 'insensitive' } },
        { machine: { brand: { contains: s, mode: 'insensitive' } } },
        { machine: { model: { contains: s, mode: 'insensitive' } } },
        { machine: { plateNumber: { contains: s, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.maintenanceRecord.findMany({
      where,
      include: {
        machine: {
          select: {
            id: true,
            brand: true,
            model: true,
            plateNumber: true,
            machineType: true,
            currentStatus: true,
          },
        },
        project: { select: { id: true, projectName: true, projectCode: true } },
        site: { select: { id: true, siteName: true, location: true } },
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedMechanic: { select: { id: true, firstName: true, lastName: true, position: true } },
        partsUsed: {
          where: { deletedAt: null },
          include: { inventoryItem: { select: { id: true, itemName: true, itemCode: true } } },
        },
      },
      orderBy: { reportedDate: 'desc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const record = await this.prisma.maintenanceRecord.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        machine: true,
        project: true,
        site: true,
        reportedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedMechanic: { select: { id: true, firstName: true, lastName: true, position: true, phone: true } },
        partsUsed: {
          where: { deletedAt: null },
          include: { inventoryItem: true },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Maintenance record with ID "${id}" not found`);
    }

    return record;
  }

  async create(companyId: string, userId: string, dto: CreateMaintenanceDto) {
    // 1. Verify Machine belongs to company
    const machine = await this.prisma.machine.findFirst({
      where: { id: dto.machineId, companyId, deletedAt: null },
    });
    if (!machine) {
      throw new BadRequestException('Machine not found in this company workspace');
    }

    // 2. Verify Project if provided
    let projectId = dto.projectId || machine.currentProjectId || undefined;
    let siteId = dto.siteId || machine.currentSiteId || undefined;

    if (projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: projectId, companyId, deletedAt: null },
      });
      if (!project) {
        throw new BadRequestException('Project not found in this company workspace');
      }
    }

    if (siteId) {
      const site = await this.prisma.site.findFirst({
        where: { id: siteId, companyId, deletedAt: null },
      });
      if (!site) {
        throw new BadRequestException('Site not found in this company workspace');
      }
      if (projectId && site.projectId !== projectId) {
        throw new BadRequestException('Selected site does not belong to the specified project');
      }
    }

    // 3. Verify Mechanic if provided
    if (dto.assignedMechanicId) {
      const mechanic = await this.prisma.employee.findFirst({
        where: { id: dto.assignedMechanicId, companyId, deletedAt: null },
      });
      if (!mechanic) {
        throw new BadRequestException('Assigned mechanic employee record not found in this company');
      }
    }

    const partsCost = dto.partsUsedValue || 0;
    const laborCost = dto.laborCost || 0;
    const extCost = dto.externalServiceCost || 0;
    const totalCost = partsCost + laborCost + extCost;

    const initialStatus = dto.status || 'Reported';

    const record = await this.prisma.maintenanceRecord.create({
      data: {
        companyId,
        machineId: dto.machineId,
        projectId: projectId || null,
        siteId: siteId || null,
        reportedById: userId,
        assignedMechanicId: dto.assignedMechanicId || null,
        maintenanceType: dto.maintenanceType,
        status: initialStatus,
        priority: dto.priority || 'Normal',
        issueTitle: dto.issueTitle,
        issueDescription: dto.issueDescription || null,
        diagnosis: dto.diagnosis || null,
        workPerformed: dto.workPerformed || null,
        partsUsedValue: partsCost,
        laborCost,
        externalServiceCost: extCost,
        totalCost,
        downtimeHours: dto.downtimeHours || 0,
        reportedDate: new Date(dto.reportedDate),
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        nextServiceDate: dto.nextServiceDate ? new Date(dto.nextServiceDate) : null,
        odometerOrHourMeterReading: dto.odometerOrHourMeterReading || null,
        notes: dto.notes || null,
        createdById: userId,
      },
    });

    // Update machine status if maintenance is starting or scheduled immediately
    if (initialStatus === 'In Progress' || initialStatus === 'Under Maintenance') {
      await this.prisma.machine.update({
        where: { id: dto.machineId },
        data: { currentStatus: 'Under Maintenance' },
      });
    }

    return this.findOne(record.id, companyId);
  }

  async update(id: string, companyId: string, userId: string, dto: UpdateMaintenanceDto) {
    const record = await this.findOne(id, companyId);

    if (record.status === 'Completed') {
      throw new ForbiddenException('Completed maintenance records are locked and read-only.');
    }

    // Verify machine if changed
    if (dto.machineId && dto.machineId !== record.machineId) {
      const machine = await this.prisma.machine.findFirst({
        where: { id: dto.machineId, companyId, deletedAt: null },
      });
      if (!machine) throw new BadRequestException('Machine not found');
    }

    // Verify mechanic if changed
    if (dto.assignedMechanicId && dto.assignedMechanicId !== record.assignedMechanicId) {
      const mechanic = await this.prisma.employee.findFirst({
        where: { id: dto.assignedMechanicId, companyId, deletedAt: null },
      });
      if (!mechanic) throw new BadRequestException('Mechanic employee not found');
    }

    const partsCost = dto.partsUsedValue !== undefined ? dto.partsUsedValue : record.partsUsedValue;
    const laborCost = dto.laborCost !== undefined ? dto.laborCost : record.laborCost;
    const extCost = dto.externalServiceCost !== undefined ? dto.externalServiceCost : record.externalServiceCost;
    const totalCost = partsCost + laborCost + extCost;

    await this.prisma.maintenanceRecord.update({
      where: { id: record.id },
      data: {
        machineId: dto.machineId || record.machineId,
        projectId: dto.projectId !== undefined ? dto.projectId : record.projectId,
        siteId: dto.siteId !== undefined ? dto.siteId : record.siteId,
        assignedMechanicId: dto.assignedMechanicId !== undefined ? dto.assignedMechanicId : record.assignedMechanicId,
        maintenanceType: dto.maintenanceType || record.maintenanceType,
        status: dto.status || record.status,
        priority: dto.priority || record.priority,
        issueTitle: dto.issueTitle || record.issueTitle,
        issueDescription: dto.issueDescription !== undefined ? dto.issueDescription : record.issueDescription,
        diagnosis: dto.diagnosis !== undefined ? dto.diagnosis : record.diagnosis,
        workPerformed: dto.workPerformed !== undefined ? dto.workPerformed : record.workPerformed,
        partsUsedValue: partsCost,
        laborCost,
        externalServiceCost: extCost,
        totalCost,
        downtimeHours: dto.downtimeHours !== undefined ? dto.downtimeHours : record.downtimeHours,
        reportedDate: dto.reportedDate ? new Date(dto.reportedDate) : record.reportedDate,
        scheduledDate: dto.scheduledDate !== undefined ? (dto.scheduledDate ? new Date(dto.scheduledDate) : null) : record.scheduledDate,
        nextServiceDate: dto.nextServiceDate !== undefined ? (dto.nextServiceDate ? new Date(dto.nextServiceDate) : null) : record.nextServiceDate,
        odometerOrHourMeterReading: dto.odometerOrHourMeterReading !== undefined ? dto.odometerOrHourMeterReading : record.odometerOrHourMeterReading,
        notes: dto.notes !== undefined ? dto.notes : record.notes,
        updatedById: userId,
      },
    });

    return this.findOne(record.id, companyId);
  }

  async delete(id: string, companyId: string) {
    const record = await this.findOne(id, companyId);

    await this.prisma.maintenanceRecord.update({
      where: { id: record.id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Maintenance record soft-deleted successfully', id };
  }

  async start(id: string, companyId: string, userId: string, dto: StartMaintenanceDto) {
    const record = await this.findOne(id, companyId);

    if (record.status === 'Completed' || record.status === 'Cancelled') {
      throw new BadRequestException(`Cannot start maintenance with status "${record.status}"`);
    }

    const mechanicId = dto.assignedMechanicId || record.assignedMechanicId;
    if (dto.assignedMechanicId) {
      const mechanic = await this.prisma.employee.findFirst({
        where: { id: dto.assignedMechanicId, companyId, deletedAt: null },
      });
      if (!mechanic) throw new BadRequestException('Assigned mechanic employee not found');
    }

    const startTimestamp = dto.startedAt ? new Date(dto.startedAt) : new Date();

    // 1. Update maintenance record
    await this.prisma.maintenanceRecord.update({
      where: { id: record.id },
      data: {
        status: 'In Progress',
        assignedMechanicId: mechanicId,
        startedAt: startTimestamp,
        notes: dto.notes ? `${record.notes || ''}\nStart Notes: ${dto.notes}` : record.notes,
        updatedById: userId,
      },
    });

    // 2. Update machine status to "Under Maintenance"
    await this.prisma.machine.update({
      where: { id: record.machineId },
      data: { currentStatus: 'Under Maintenance' },
    });

    return this.findOne(record.id, companyId);
  }

  async complete(id: string, companyId: string, userId: string, dto: CompleteMaintenanceDto) {
    const record = await this.findOne(id, companyId);

    if (record.status !== 'In Progress' && record.status !== 'Scheduled' && record.status !== 'Reported') {
      throw new BadRequestException(`Cannot complete maintenance with status "${record.status}"`);
    }

    const completionTime = dto.completedAt ? new Date(dto.completedAt) : new Date();

    if (record.startedAt && completionTime < record.startedAt) {
      throw new BadRequestException('Completed date cannot be before started date');
    }

    if (dto.nextServiceDate && new Date(dto.nextServiceDate) < completionTime) {
      throw new BadRequestException('Next service date cannot be before completed date');
    }

    let sparePartsTotalCost = dto.partsUsedValue || record.partsUsedValue || 0;

    // Process specific spare parts used if provided
    if (dto.partsUsed && dto.partsUsed.length > 0) {
      let calcPartsCost = 0;

      for (const part of dto.partsUsed) {
        const item = await this.prisma.inventoryItem.findFirst({
          where: { id: part.inventoryItemId, companyId, deletedAt: null },
        });

        if (!item) {
          throw new BadRequestException(`Inventory item "${part.inventoryItemId}" not found`);
        }

        if (item.currentQuantity < part.quantityUsed) {
          throw new BadRequestException(
            `Insufficient stock balance for "${item.itemName}". Available: ${item.currentQuantity}, Requested: ${part.quantityUsed}`,
          );
        }

        const unitCost = part.unitCost !== undefined ? part.unitCost : item.averageUnitCost || 0;
        const totalPartCost = part.quantityUsed * unitCost;
        calcPartsCost += totalPartCost;

        // Deduct inventory
        await this.prisma.inventoryItem.update({
          where: { id: item.id },
          data: {
            currentQuantity: item.currentQuantity - part.quantityUsed,
            totalValue: Math.max(0, (item.currentQuantity - part.quantityUsed) * unitCost),
          },
        });

        // Record MaintenancePart
        await this.prisma.maintenancePart.create({
          data: {
            companyId,
            maintenanceRecordId: record.id,
            inventoryItemId: item.id,
            quantityUsed: part.quantityUsed,
            unitCost,
            totalCost: totalPartCost,
            notes: part.notes,
          },
        });

        // Create StockMovement record for audit trail
        await this.prisma.stockMovement.create({
          data: {
            companyId,
            inventoryItemId: item.id,
            projectId: record.projectId,
            siteId: record.siteId,
            requestedById: userId,
            issuedById: userId,
            movementType: 'STOCK_OUT',
            quantity: part.quantityUsed,
            unitCost,
            totalCost: totalPartCost,
            notes: `Spare part issued for maintenance record: ${record.issueTitle}`,
          },
        });
      }

      sparePartsTotalCost = Math.max(sparePartsTotalCost, calcPartsCost);
    }

    const laborCost = dto.laborCost !== undefined ? dto.laborCost : record.laborCost;
    const extCost = dto.externalServiceCost !== undefined ? dto.externalServiceCost : record.externalServiceCost;
    const totalCost = sparePartsTotalCost + laborCost + extCost;

    // Update maintenance record to Completed
    await this.prisma.maintenanceRecord.update({
      where: { id: record.id },
      data: {
        status: 'Completed',
        diagnosis: dto.diagnosis || record.diagnosis,
        workPerformed: dto.workPerformed || record.workPerformed,
        partsUsedValue: sparePartsTotalCost,
        laborCost,
        externalServiceCost: extCost,
        totalCost,
        downtimeHours: dto.downtimeHours !== undefined ? dto.downtimeHours : record.downtimeHours,
        completedAt: completionTime,
        nextServiceDate: dto.nextServiceDate ? new Date(dto.nextServiceDate) : record.nextServiceDate,
        notes: dto.notes ? `${record.notes || ''}\nCompletion Notes: ${dto.notes}` : record.notes,
        updatedById: userId,
      },
    });

    // Restore machine status
    const machine = await this.prisma.machine.findFirst({ where: { id: record.machineId } });
    if (machine) {
      const restoredStatus = machine.currentProjectId ? 'Active' : 'Available';
      await this.prisma.machine.update({
        where: { id: machine.id },
        data: { currentStatus: restoredStatus },
      });
    }

    return this.findOne(record.id, companyId);
  }

  async cancel(id: string, companyId: string, userId: string, dto: CancelMaintenanceDto) {
    const record = await this.findOne(id, companyId);

    if (record.status === 'Completed') {
      throw new BadRequestException('Cannot cancel an already completed maintenance record');
    }

    await this.prisma.maintenanceRecord.update({
      where: { id: record.id },
      data: {
        status: 'Cancelled',
        notes: dto.reason ? `${record.notes || ''}\nCancellation Reason: ${dto.reason}` : record.notes,
        updatedById: userId,
      },
    });

    // Restore machine status if it was under maintenance
    const machine = await this.prisma.machine.findFirst({ where: { id: record.machineId } });
    if (machine && machine.currentStatus === 'Under Maintenance') {
      const restoredStatus = machine.currentProjectId ? 'Active' : 'Available';
      await this.prisma.machine.update({
        where: { id: machine.id },
        data: { currentStatus: restoredStatus },
      });
    }

    return this.findOne(record.id, companyId);
  }

  async findByMachine(machineId: string, companyId: string) {
    return this.findAll(companyId, { machineId });
  }

  async getUpcomingSchedule(companyId: string) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcoming = await this.prisma.maintenanceRecord.findMany({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { status: { in: ['Reported', 'Scheduled', 'In Progress'] } },
          { nextServiceDate: { gte: now } },
        ],
      },
      include: {
        machine: true,
        project: true,
        site: true,
        assignedMechanic: true,
      },
      orderBy: { scheduledDate: 'asc' },
    });

    const overdue = upcoming.filter(
      (r) => r.scheduledDate && new Date(r.scheduledDate) < now && r.status !== 'Completed' && r.status !== 'Cancelled',
    );

    const dueReminders = upcoming.filter(
      (r) => r.nextServiceDate && new Date(r.nextServiceDate) >= now,
    );

    return {
      totalScheduled: upcoming.length,
      overdueCount: overdue.length,
      dueRemindersCount: dueReminders.length,
      records: upcoming,
      overdueRecords: overdue,
      reminders: dueReminders,
    };
  }

  async getSummaryReport(companyId: string) {
    const records = await this.prisma.maintenanceRecord.findMany({
      where: { companyId, deletedAt: null },
      include: { machine: true, project: true },
    });

    const totalRecords = records.length;
    const completedCount = records.filter((r) => r.status === 'Completed').length;
    const openIssuesCount = records.filter((r) => ['Reported', 'Scheduled', 'In Progress'].includes(r.status)).length;
    const urgentCount = records.filter((r) => ['Urgent', 'Critical'].includes(r.priority) && r.status !== 'Completed').length;

    const totalMaintenanceCost = records.reduce((acc, r) => acc + (r.totalCost || 0), 0);
    const totalDowntimeHours = records.reduce((acc, r) => acc + (r.downtimeHours || 0), 0);

    return {
      totalRecords,
      completedCount,
      openIssuesCount,
      urgentCount,
      totalMaintenanceCost: Math.round(totalMaintenanceCost * 100) / 100,
      totalDowntimeHours: Math.round(totalDowntimeHours * 10) / 10,
    };
  }

  async getReportByMachine(companyId: string) {
    const records = await this.prisma.maintenanceRecord.findMany({
      where: { companyId, deletedAt: null },
      include: { machine: true },
    });

    const machineMap = new Map<string, { machine: string; totalCost: number; downtimeHours: number; count: number }>();

    for (const r of records) {
      const name = r.machine ? `${r.machine.brand} ${r.machine.model}` : 'Unknown Machine';
      const prev = machineMap.get(name) || { machine: name, totalCost: 0, downtimeHours: 0, count: 0 };
      machineMap.set(name, {
        machine: name,
        totalCost: prev.totalCost + (r.totalCost || 0),
        downtimeHours: prev.downtimeHours + (r.downtimeHours || 0),
        count: prev.count + 1,
      });
    }

    return Array.from(machineMap.values()).sort((a, b) => b.totalCost - a.totalCost);
  }

  async getReportByProject(companyId: string) {
    const records = await this.prisma.maintenanceRecord.findMany({
      where: { companyId, deletedAt: null },
      include: { project: true },
    });

    const projectMap = new Map<string, { project: string; totalCost: number; count: number }>();

    for (const r of records) {
      const name = r.project ? r.project.projectName : 'Unassigned Project';
      const prev = projectMap.get(name) || { project: name, totalCost: 0, count: 0 };
      projectMap.set(name, {
        project: name,
        totalCost: prev.totalCost + (r.totalCost || 0),
        count: prev.count + 1,
      });
    }

    return Array.from(projectMap.values()).sort((a, b) => b.totalCost - a.totalCost);
  }
}
