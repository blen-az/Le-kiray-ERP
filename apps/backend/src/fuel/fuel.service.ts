import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFuelRequestDto } from './dto/create-fuel-request.dto';
import { UpdateFuelRequestDto } from './dto/update-fuel-request.dto';
import { ApproveFuelRequestDto } from './dto/approve-fuel-request.dto';
import { RejectFuelRequestDto } from './dto/reject-fuel-request.dto';
import { IssueFuelRequestDto } from './dto/issue-fuel-request.dto';
import { CreateFuelLogDto } from './dto/create-fuel-log.dto';
import { UpdateFuelLogDto } from './dto/update-fuel-log.dto';

@Injectable()
export class FuelService {
  constructor(private prisma: PrismaService) {}

  // --- Requests Operations ---

  async findAllRequests(companyId: string) {
    return this.prisma.fuelRequest.findMany({
      where: { companyId, deletedAt: null },
      include: {
        machine: { select: { id: true, brand: true, model: true, plateNumber: true } },
        project: { select: { id: true, projectName: true } },
        site: { select: { id: true, siteName: true } },
        operator: { select: { id: true, firstName: true, lastName: true } },
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        issuedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneRequest(id: string, companyId: string) {
    const request = await this.prisma.fuelRequest.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        machine: true,
        project: true,
        site: true,
        operator: { select: { id: true, firstName: true, lastName: true, role: true } },
        requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        issuedBy: { select: { id: true, firstName: true, lastName: true } },
        fuelLogs: {
          where: { deletedAt: null },
          orderBy: { usageDate: 'desc' },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Fuel request not found in this company workspace');
    }
    return request;
  }

  async createRequest(companyId: string, userId: string, dto: CreateFuelRequestDto) {
    // 1. Verify machine
    const machine = await this.prisma.machine.findFirst({
      where: { id: dto.machineId, companyId, deletedAt: null },
    });
    if (!machine) {
      throw new BadRequestException('Machine must belong to the same company');
    }

    // 2. Verify project
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, companyId, deletedAt: null },
    });
    if (!project) {
      throw new BadRequestException('Project must belong to the same company');
    }

    // 3. Verify site
    const site = await this.prisma.site.findFirst({
      where: { id: dto.siteId, projectId: dto.projectId, companyId, deletedAt: null },
    });
    if (!site) {
      throw new BadRequestException('Site must belong to the selected project');
    }

    // 4. Verify operator
    const operator = await this.prisma.employee.findFirst({
      where: { id: dto.operatorId, companyId, deletedAt: null },
    });
    if (!operator) {
      throw new BadRequestException('Operator must belong to the same company');
    }

    // 5. Deployed location verification
    if (machine.currentProjectId && (machine.currentProjectId !== dto.projectId || machine.currentSiteId !== dto.siteId)) {
      throw new BadRequestException('Machine must be assigned to the selected project/site');
    }

    return this.prisma.fuelRequest.create({
      data: {
        companyId,
        projectId: dto.projectId,
        siteId: dto.siteId,
        machineId: dto.machineId,
        operatorId: dto.operatorId,
        requestedById: userId,
        litersRequested: dto.litersRequested,
        requestDate: new Date(dto.requestDate),
        status: 'Pending',
        priority: dto.priority,
        purpose: dto.purpose || null,
        notes: dto.notes || null,
        createdById: userId,
      },
    });
  }

  async updateRequest(id: string, companyId: string, userId: string, dto: UpdateFuelRequestDto) {
    const request = await this.prisma.fuelRequest.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!request) {
      throw new NotFoundException('Fuel request not found in this company workspace');
    }

    if (request.status !== 'Pending') {
      throw new BadRequestException('Only pending fuel requests can be modified');
    }

    // Validations if updating entities
    if (dto.machineId) {
      const m = await this.prisma.machine.findFirst({ where: { id: dto.machineId, companyId, deletedAt: null } });
      if (!m) throw new BadRequestException('Machine must belong to the same company');
    }
    if (dto.projectId) {
      const p = await this.prisma.project.findFirst({ where: { id: dto.projectId, companyId, deletedAt: null } });
      if (!p) throw new BadRequestException('Project must belong to the same company');
    }
    if (dto.siteId) {
      const pId = dto.projectId || request.projectId;
      const s = await this.prisma.site.findFirst({ where: { id: dto.siteId, projectId: pId, companyId, deletedAt: null } });
      if (!s) throw new BadRequestException('Site must belong to the selected project');
    }
    if (dto.operatorId) {
      const o = await this.prisma.employee.findFirst({ where: { id: dto.operatorId, companyId, deletedAt: null } });
      if (!o) throw new BadRequestException('Operator must belong to the same company');
    }

    return this.prisma.fuelRequest.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        siteId: dto.siteId,
        machineId: dto.machineId,
        operatorId: dto.operatorId,
        litersRequested: dto.litersRequested,
        requestDate: dto.requestDate ? new Date(dto.requestDate) : undefined,
        priority: dto.priority,
        purpose: dto.purpose,
        notes: dto.notes,
        updatedById: userId,
      },
    });
  }

  async approveRequest(id: string, companyId: string, userId: string, dto: ApproveFuelRequestDto) {
    const request = await this.prisma.fuelRequest.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!request) {
      throw new NotFoundException('Fuel request not found in this company workspace');
    }

    if (request.status !== 'Pending') {
      throw new BadRequestException('Fuel request must be pending to approve');
    }

    // Liter check (Liters approved cannot exceed liters requested)
    if (dto.litersApproved > request.litersRequested) {
      throw new BadRequestException('Liters approved cannot exceed liters requested');
    }

    return this.prisma.fuelRequest.update({
      where: { id },
      data: {
        status: 'Approved',
        litersApproved: dto.litersApproved,
        costPerLiter: dto.costPerLiter,
        totalCost: dto.litersApproved * dto.costPerLiter,
        approvedById: userId,
        approvedAt: new Date(),
        notes: dto.notes || request.notes,
        updatedById: userId,
      },
    });
  }

  async rejectRequest(id: string, companyId: string, userId: string, dto: RejectFuelRequestDto) {
    const request = await this.prisma.fuelRequest.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!request) {
      throw new NotFoundException('Fuel request not found in this company workspace');
    }

    if (request.status !== 'Pending') {
      throw new BadRequestException('Fuel request must be pending to reject');
    }

    return this.prisma.fuelRequest.update({
      where: { id },
      data: {
        status: 'Rejected',
        rejectionReason: dto.rejectionReason,
        approvedById: userId,
        approvedAt: new Date(),
        updatedById: userId,
      },
    });
  }

  async issueRequest(id: string, companyId: string, userId: string, dto: IssueFuelRequestDto) {
    const request = await this.prisma.fuelRequest.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!request) {
      throw new NotFoundException('Fuel request not found in this company workspace');
    }

    if (request.status !== 'Approved' && request.status !== 'Partially Issued') {
      throw new BadRequestException('Fuel request must be approved before issuing');
    }

    // Liter check
    const remaining = request.litersApproved - request.litersIssued;
    if (dto.litersIssued > remaining) {
      throw new BadRequestException('Liters issued cannot exceed remaining approved liters');
    }

    // 1. Verify Diesel inventory exists and has stock
    const dieselItem = await this.prisma.inventoryItem.findFirst({
      where: { companyId, OR: [{ category: 'Diesel' }, { category: 'FUEL' }, { isFuelItem: true }, { itemName: { contains: 'Diesel', mode: 'insensitive' } }], deletedAt: null },
    });
    if (!dieselItem || dieselItem.currentQuantity < dto.litersIssued) {
      throw new BadRequestException('Insufficient diesel stock in inventory');
    }

    // 2. Deduct Diesel stock balance
    await this.prisma.inventoryItem.update({
      where: { id: dieselItem.id },
      data: {
        currentQuantity: {
          decrement: dto.litersIssued,
        },
      },
    });

    // 3. Create StockMovement record
    await this.prisma.stockMovement.create({
      data: {
        companyId,
        inventoryItemId: dieselItem.id,
        fromWarehouseId: dieselItem.defaultWarehouseId || null,
        projectId: request.projectId,
        siteId: request.siteId,
        machineId: request.machineId,
        fuelRequestId: request.id,
        quantity: dto.litersIssued,
        movementType: 'FUEL_ISSUE',
        unitCost: request.costPerLiter || 0,
        totalCost: dto.litersIssued * (request.costPerLiter || 0),
        requestedById: request.requestedById,
        approvedById: request.approvedById,
        issuedById: userId,
        createdById: userId,
      },
    });

    // 4. Update request litersIssued and Status
    const totalIssued = request.litersIssued + dto.litersIssued;
    const finalStatus = totalIssued >= request.litersApproved ? 'Issued' : 'Partially Issued';

    const updatedRequest = await this.prisma.fuelRequest.update({
      where: { id },
      data: {
        litersIssued: totalIssued,
        status: finalStatus,
        issuedById: userId,
        issuedAt: new Date(dto.usageDate),
        updatedById: userId,
      },
    });

    // 5. Create FuelLog record
    await this.prisma.fuelLog.create({
      data: {
        companyId,
        fuelRequestId: id,
        projectId: request.projectId,
        siteId: request.siteId,
        machineId: request.machineId,
        operatorId: request.operatorId,
        issuedById: userId,
        litersUsed: dto.litersIssued,
        costPerLiter: request.costPerLiter || 0,
        totalCost: dto.litersIssued * (request.costPerLiter || 0),
        usageDate: new Date(dto.usageDate),
        workingHours: dto.workingHours || 0,
        odometerOrHourMeterReading: dto.odometerOrHourMeterReading || null,
        receiptUrl: dto.receiptUrl || null,
        notes: dto.notes || null,
        createdById: userId,
      },
    });

    return updatedRequest;
  }

  async deleteRequest(id: string, companyId: string, userId: string) {
    const request = await this.prisma.fuelRequest.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!request) {
      throw new NotFoundException('Fuel request not found in this company workspace');
    }

    // Soft delete child logs
    await this.prisma.fuelLog.updateMany({
      where: { fuelRequestId: id, companyId, deletedAt: null },
      data: {
        deletedAt: new Date(),
        updatedById: userId,
      },
    });

    return this.prisma.fuelRequest.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: userId,
      },
    });
  }

  // --- Logs Operations ---

  async findAllLogs(companyId: string) {
    return this.prisma.fuelLog.findMany({
      where: { companyId, deletedAt: null },
      include: {
        machine: { select: { id: true, brand: true, model: true, plateNumber: true } },
        project: { select: { id: true, projectName: true } },
        site: { select: { id: true, siteName: true } },
        operator: { select: { id: true, firstName: true, lastName: true } },
        issuedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { usageDate: 'desc' },
    });
  }

  async findOneLog(id: string, companyId: string) {
    const log = await this.prisma.fuelLog.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        machine: true,
        project: true,
        site: true,
        operator: true,
        issuedBy: true,
      },
    });
    if (!log) {
      throw new NotFoundException('Fuel log not found in this company workspace');
    }
    return log;
  }

  async createLog(companyId: string, userId: string, dto: CreateFuelLogDto) {
    // validations
    const machine = await this.prisma.machine.findFirst({ where: { id: dto.machineId, companyId, deletedAt: null } });
    if (!machine) throw new BadRequestException('Machine must belong to the same company');

    const project = await this.prisma.project.findFirst({ where: { id: dto.projectId, companyId, deletedAt: null } });
    if (!project) throw new BadRequestException('Project must belong to the same company');

    const site = await this.prisma.site.findFirst({ where: { id: dto.siteId, projectId: dto.projectId, companyId, deletedAt: null } });
    if (!site) throw new BadRequestException('Site must belong to the selected project');

    if (dto.operatorId) {
      const operator = await this.prisma.employee.findFirst({ where: { id: dto.operatorId, companyId, deletedAt: null } });
      if (!operator) throw new BadRequestException('Operator must belong to the same company');
    }

    // Deduct stock if Diesel inventory exists
    const dieselItem = await this.prisma.inventoryItem.findFirst({
      where: { companyId, OR: [{ category: 'Diesel' }, { category: 'FUEL' }, { isFuelItem: true }, { itemName: { contains: 'Diesel', mode: 'insensitive' } }], deletedAt: null },
    });
    if (dieselItem) {
      if (dieselItem.currentQuantity < dto.litersUsed) {
        throw new BadRequestException('Insufficient diesel stock in inventory');
      }
      await this.prisma.inventoryItem.update({
        where: { id: dieselItem.id },
        data: { currentQuantity: { decrement: dto.litersUsed } },
      });
      await this.prisma.stockMovement.create({
        data: {
          companyId,
          inventoryItemId: dieselItem.id,
          fromWarehouseId: dieselItem.defaultWarehouseId || null,
          projectId: dto.projectId,
          siteId: dto.siteId,
          machineId: dto.machineId,
          quantity: dto.litersUsed,
          movementType: 'FUEL_ISSUE',
          unitCost: dto.costPerLiter,
          totalCost: dto.costPerLiter ? dto.litersUsed * dto.costPerLiter : 0,
          approvedById: userId,
          createdById: userId,
        },
      });
    }

    return this.prisma.fuelLog.create({
      data: {
        companyId,
        projectId: dto.projectId,
        siteId: dto.siteId,
        machineId: dto.machineId,
        operatorId: dto.operatorId || null,
        issuedById: userId,
        litersUsed: dto.litersUsed,
        costPerLiter: dto.costPerLiter,
        totalCost: dto.litersUsed * dto.costPerLiter,
        usageDate: new Date(dto.usageDate),
        workingHours: dto.workingHours || 0,
        odometerOrHourMeterReading: dto.odometerOrHourMeterReading || null,
        receiptUrl: dto.receiptUrl || null,
        notes: dto.notes || null,
        createdById: userId,
      },
    });
  }

  async updateLog(id: string, companyId: string, userId: string, dto: UpdateFuelLogDto) {
    const log = await this.prisma.fuelLog.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!log) throw new NotFoundException('Fuel log not found');

    return this.prisma.fuelLog.update({
      where: { id },
      data: {
        projectId: dto.projectId,
        siteId: dto.siteId,
        machineId: dto.machineId,
        operatorId: dto.operatorId,
        litersUsed: dto.litersUsed,
        costPerLiter: dto.costPerLiter,
        totalCost: dto.litersUsed && dto.costPerLiter ? dto.litersUsed * dto.costPerLiter : undefined,
        usageDate: dto.usageDate ? new Date(dto.usageDate) : undefined,
        workingHours: dto.workingHours,
        odometerOrHourMeterReading: dto.odometerOrHourMeterReading,
        receiptUrl: dto.receiptUrl,
        notes: dto.notes,
        updatedById: userId,
      },
    });
  }

  async deleteLog(id: string, companyId: string, userId: string) {
    const log = await this.prisma.fuelLog.findFirst({
      where: { id, companyId, deletedAt: null },
    });
    if (!log) throw new NotFoundException('Fuel log not found');

    return this.prisma.fuelLog.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedById: userId,
      },
    });
  }

  // --- Reporting Operations ---

  async getSummary(companyId: string) {
    const logs = await this.prisma.fuelLog.findMany({
      where: { companyId, deletedAt: null },
    });

    const totalCost = logs.reduce((sum, log) => sum + log.totalCost, 0);
    const totalLiters = logs.reduce((sum, log) => sum + log.litersUsed, 0);
    const averageCost = totalLiters > 0 ? totalCost / totalLiters : 0;

    const pendingRequestsCount = await this.prisma.fuelRequest.count({
      where: { companyId, status: 'Pending', deletedAt: null },
    });

    return {
      totalCost,
      totalLiters,
      averageCost,
      pendingRequestsCount,
    };
  }

  async getByProject(companyId: string) {
    const logs = await this.prisma.fuelLog.findMany({
      where: { companyId, deletedAt: null },
      include: { project: { select: { projectName: true } } },
    });

    const groups: Record<string, { projectId: string; projectName: string; totalLiters: number; totalCost: number }> = {};
    for (const log of logs) {
      const pId = log.projectId;
      if (!groups[pId]) {
        groups[pId] = {
          projectId: pId,
          projectName: log.project.projectName,
          totalLiters: 0,
          totalCost: 0,
        };
      }
      groups[pId].totalLiters += log.litersUsed;
      groups[pId].totalCost += log.totalCost;
    }

    return Object.values(groups);
  }

  async getByMachine(companyId: string) {
    const logs = await this.prisma.fuelLog.findMany({
      where: { companyId, deletedAt: null },
      include: { machine: { select: { brand: true, model: true, plateNumber: true } } },
    });

    const groups: Record<string, { machineId: string; brand: string; model: string; plateNumber: string | null; totalLiters: number; totalCost: number }> = {};
    for (const log of logs) {
      const mId = log.machineId;
      if (!groups[mId]) {
        groups[mId] = {
          machineId: mId,
          brand: log.machine.brand,
          model: log.machine.model,
          plateNumber: log.machine.plateNumber,
          totalLiters: 0,
          totalCost: 0,
        };
      }
      groups[mId].totalLiters += log.litersUsed;
      groups[mId].totalCost += log.totalCost;
    }

    return Object.values(groups);
  }

  async getByOperator(companyId: string) {
    const logs = await this.prisma.fuelLog.findMany({
      where: { companyId, deletedAt: null },
      include: { operator: { select: { firstName: true, lastName: true } } },
    });

    const groups: Record<string, { operatorId: string | null; operatorName: string; totalLiters: number; totalCost: number }> = {};
    for (const log of logs) {
      const opId = log.operatorId || 'unassigned';
      if (!groups[opId]) {
        groups[opId] = {
          operatorId: log.operatorId,
          operatorName: log.operator ? `${log.operator.firstName} ${log.operator.lastName}` : 'Unassigned',
          totalLiters: 0,
          totalCost: 0,
        };
      }
      groups[opId].totalLiters += log.litersUsed;
      groups[opId].totalCost += log.totalCost;
    }

    return Object.values(groups);
  }
}
