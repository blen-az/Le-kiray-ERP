import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { UpdateStockMovementDto } from './dto/update-stock-movement.dto';
import { CreateInventoryRequestDto } from './dto/create-inventory-request.dto';
import { ApproveInventoryRequestDto } from './dto/approve-inventory-request.dto';
import { RejectInventoryRequestDto } from './dto/reject-inventory-request.dto';
import { IssueInventoryRequestDto } from './dto/issue-inventory-request.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // ----------------------------------------------------
  // WAREHOUSES & SITE STORES
  // ----------------------------------------------------

  async findAllWarehouses(companyId: string) {
    return this.prisma.warehouse.findMany({
      where: { companyId, deletedAt: null },
      include: {
        project: { select: { id: true, projectName: true } },
        site: { select: { id: true, siteName: true } },
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        inventoryItems: { where: { deletedAt: null } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneWarehouse(id: string, companyId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        project: true,
        site: true,
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        inventoryItems: { where: { deletedAt: null } },
        fromMovements: { take: 20, orderBy: { createdAt: 'desc' } },
        toMovements: { take: 20, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!warehouse) {
      throw new NotFoundException('Warehouse not found');
    }
    return warehouse;
  }

  async createWarehouse(companyId: string, userId: string, dto: CreateWarehouseDto) {
    if (dto.type === 'Site Store') {
      if (!dto.projectId) throw new BadRequestException('Project is required for Site Store');
      if (!dto.siteId) throw new BadRequestException('Site is required for Site Store');
    }

    if (dto.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, companyId, deletedAt: null },
      });
      if (!project) throw new BadRequestException('Project not found in this company');
    }

    if (dto.siteId) {
      const site = await this.prisma.site.findFirst({
        where: { id: dto.siteId, companyId, deletedAt: null },
      });
      if (!site) throw new BadRequestException('Site not found in this company');
      if (dto.projectId && site.projectId !== dto.projectId) {
        throw new BadRequestException('Site does not belong to the selected project');
      }
    }

    if (dto.managerId) {
      const manager = await this.prisma.user.findFirst({
        where: { id: dto.managerId, companyId, deletedAt: null },
      });
      if (!manager) throw new BadRequestException('Manager user not found in this company');
    }

    return this.prisma.warehouse.create({
      data: {
        companyId,
        warehouseName: dto.warehouseName,
        warehouseCode: dto.warehouseCode || null,
        type: dto.type,
        projectId: dto.projectId || null,
        siteId: dto.siteId || null,
        location: dto.location || null,
        managerId: dto.managerId || null,
        status: dto.status || 'Active',
        notes: dto.notes || null,
        createdById: userId,
      },
      include: {
        project: true,
        site: true,
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateWarehouse(id: string, companyId: string, userId: string, dto: UpdateWarehouseDto) {
    const warehouse = await this.findOneWarehouse(id, companyId);

    const type = dto.type || warehouse.type;
    const projectId = dto.projectId !== undefined ? dto.projectId : warehouse.projectId;
    const siteId = dto.siteId !== undefined ? dto.siteId : warehouse.siteId;

    if (type === 'Site Store') {
      if (!projectId) throw new BadRequestException('Project is required for Site Store');
      if (!siteId) throw new BadRequestException('Site is required for Site Store');
    }

    if (dto.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, companyId, deletedAt: null },
      });
      if (!project) throw new BadRequestException('Project not found in this company');
    }

    if (dto.siteId) {
      const site = await this.prisma.site.findFirst({
        where: { id: dto.siteId, companyId, deletedAt: null },
      });
      if (!site) throw new BadRequestException('Site not found in this company');
      if (projectId && site.projectId !== projectId) {
        throw new BadRequestException('Site does not belong to the selected project');
      }
    }

    if (dto.managerId) {
      const manager = await this.prisma.user.findFirst({
        where: { id: dto.managerId, companyId, deletedAt: null },
      });
      if (!manager) throw new BadRequestException('Manager user not found in this company');
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: {
        ...(dto.warehouseName && { warehouseName: dto.warehouseName }),
        ...(dto.warehouseCode !== undefined && { warehouseCode: dto.warehouseCode }),
        ...(dto.type && { type: dto.type }),
        ...(dto.projectId !== undefined && { projectId: dto.projectId }),
        ...(dto.siteId !== undefined && { siteId: dto.siteId }),
        ...(dto.location !== undefined && { location: dto.location }),
        ...(dto.managerId !== undefined && { managerId: dto.managerId }),
        ...(dto.status && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        updatedById: userId,
      },
      include: {
        project: true,
        site: true,
        manager: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async softDeleteWarehouse(id: string, companyId: string) {
    await this.findOneWarehouse(id, companyId);
    return this.prisma.warehouse.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ----------------------------------------------------
  // INVENTORY ITEMS
  // ----------------------------------------------------

  async findAllItems(companyId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { companyId, deletedAt: null },
      include: {
        defaultWarehouse: true,
      },
      orderBy: { itemName: 'asc' },
    });
  }

  async findOneItem(id: string, companyId: string) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        defaultWarehouse: true,
        stockMovements: {
          where: { deletedAt: null },
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            fromWarehouse: true,
            toWarehouse: true,
            project: true,
            site: true,
            requestedBy: { select: { firstName: true, lastName: true } },
            approvedBy: { select: { firstName: true, lastName: true } },
            issuedBy: { select: { firstName: true, lastName: true } },
          },
        },
        inventoryRequests: {
          where: { deletedAt: null },
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            project: true,
            site: true,
            requestedBy: { select: { firstName: true, lastName: true } },
            approvedBy: { select: { firstName: true, lastName: true } },
            issuedBy: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!item) {
      throw new NotFoundException('Inventory item not found');
    }
    return item;
  }

  async createItem(companyId: string, userId: string, dto: CreateInventoryItemDto) {
    if (dto.defaultWarehouseId) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: { id: dto.defaultWarehouseId, companyId, deletedAt: null },
      });
      if (!warehouse) {
        throw new BadRequestException('Default warehouse must belong to the same company');
      }
    }

    const currentQuantity = dto.currentQuantity ?? 0;
    const minimumStockLevel = dto.minimumStockLevel ?? 0;
    const averageUnitCost = dto.averageUnitCost ?? 0;
    const totalValue = currentQuantity * averageUnitCost;

    let status = dto.status || 'Active';
    if (currentQuantity <= 0) status = 'Out of Stock';
    else if (currentQuantity <= minimumStockLevel) status = 'Low Stock';

    return this.prisma.inventoryItem.create({
      data: {
        companyId,
        itemName: dto.itemName,
        itemCode: dto.itemCode || null,
        category: dto.category,
        unit: dto.unit,
        description: dto.description || null,
        currentQuantity,
        minimumStockLevel,
        maximumStockLevel: dto.maximumStockLevel || null,
        averageUnitCost,
        totalValue,
        defaultWarehouseId: dto.defaultWarehouseId || null,
        isFuelItem: dto.isFuelItem || false,
        isConsumable: dto.isConsumable || false,
        isTool: dto.isTool || false,
        isSparePart: dto.isSparePart || false,
        status,
        createdById: userId,
      },
      include: {
        defaultWarehouse: true,
      },
    });
  }

  async updateItem(id: string, companyId: string, userId: string, dto: UpdateInventoryItemDto) {
    const item = await this.findOneItem(id, companyId);

    if (dto.defaultWarehouseId) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: { id: dto.defaultWarehouseId, companyId, deletedAt: null },
      });
      if (!warehouse) {
        throw new BadRequestException('Default warehouse must belong to the same company');
      }
    }

    const currentQuantity = dto.currentQuantity !== undefined ? dto.currentQuantity : item.currentQuantity;
    const minimumStockLevel = dto.minimumStockLevel !== undefined ? dto.minimumStockLevel : item.minimumStockLevel;
    const averageUnitCost = dto.averageUnitCost !== undefined ? dto.averageUnitCost : item.averageUnitCost;
    const totalValue = currentQuantity * averageUnitCost;

    let status = dto.status || item.status;
    if (currentQuantity <= 0) status = 'Out of Stock';
    else if (currentQuantity <= minimumStockLevel) status = 'Low Stock';
    else if (status === 'Low Stock' || status === 'Out of Stock') status = 'Active';

    return this.prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(dto.itemName && { itemName: dto.itemName }),
        ...(dto.itemCode !== undefined && { itemCode: dto.itemCode }),
        ...(dto.category && { category: dto.category }),
        ...(dto.unit && { unit: dto.unit }),
        ...(dto.description !== undefined && { description: dto.description }),
        currentQuantity,
        minimumStockLevel,
        ...(dto.maximumStockLevel !== undefined && { maximumStockLevel: dto.maximumStockLevel }),
        averageUnitCost,
        totalValue,
        ...(dto.defaultWarehouseId !== undefined && { defaultWarehouseId: dto.defaultWarehouseId }),
        ...(dto.isFuelItem !== undefined && { isFuelItem: dto.isFuelItem }),
        ...(dto.isConsumable !== undefined && { isConsumable: dto.isConsumable }),
        ...(dto.isTool !== undefined && { isTool: dto.isTool }),
        ...(dto.isSparePart !== undefined && { isSparePart: dto.isSparePart }),
        status,
        updatedById: userId,
      },
      include: {
        defaultWarehouse: true,
      },
    });
  }

  async softDeleteItem(id: string, companyId: string) {
    await this.findOneItem(id, companyId);
    return this.prisma.inventoryItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ----------------------------------------------------
  // STOCK MOVEMENTS
  // ----------------------------------------------------

  async findMovements(companyId: string, query?: any) {
    return this.prisma.stockMovement.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(query?.movementType && { movementType: query.movementType }),
        ...(query?.inventoryItemId && { inventoryItemId: query.inventoryItemId }),
        ...(query?.projectId && { projectId: query.projectId }),
      },
      include: {
        inventoryItem: true,
        fromWarehouse: true,
        toWarehouse: true,
        project: true,
        site: true,
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        issuedBy: { select: { id: true, firstName: true, lastName: true } },
        machine: { select: { id: true, brand: true, model: true, plateNumber: true } },
      },
      orderBy: { movementDate: 'desc' },
    });
  }

  async findOneMovement(id: string, companyId: string) {
    const movement = await this.prisma.stockMovement.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        inventoryItem: true,
        fromWarehouse: true,
        toWarehouse: true,
        project: true,
        site: true,
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        issuedBy: { select: { id: true, firstName: true, lastName: true } },
        machine: true,
        fuelRequest: true,
      },
    });
    if (!movement) throw new NotFoundException('Stock movement not found');
    return movement;
  }

  async recordMovement(companyId: string, userId: string, dto: CreateStockMovementDto) {
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: dto.inventoryItemId, companyId, deletedAt: null },
    });
    if (!item) throw new BadRequestException('Inventory item not found in this company');

    if (dto.fromWarehouseId) {
      const fromWh = await this.prisma.warehouse.findFirst({
        where: { id: dto.fromWarehouseId, companyId, deletedAt: null },
      });
      if (!fromWh) throw new BadRequestException('Source warehouse must belong to the same company');
    }

    if (dto.toWarehouseId) {
      const toWh = await this.prisma.warehouse.findFirst({
        where: { id: dto.toWarehouseId, companyId, deletedAt: null },
      });
      if (!toWh) throw new BadRequestException('Destination warehouse must belong to the same company');
    }

    // Source warehouse required checks
    const requiresSource = ['STOCK_OUT', 'TRANSFER', 'DAMAGED', 'LOST', 'FUEL_ISSUE'];
    if (requiresSource.includes(dto.movementType) && !dto.fromWarehouseId && !item.defaultWarehouseId) {
      throw new BadRequestException(`Source warehouse is required for ${dto.movementType}`);
    }

    // Destination warehouse required checks
    const requiresDest = ['STOCK_IN', 'TRANSFER', 'RETURN'];
    if (requiresDest.includes(dto.movementType) && !dto.toWarehouseId && !item.defaultWarehouseId) {
      throw new BadRequestException(`Destination warehouse is required for ${dto.movementType}`);
    }

    if (dto.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: dto.projectId, companyId, deletedAt: null },
      });
      if (!project) throw new BadRequestException('Project must belong to the same company');
    }

    if (dto.siteId) {
      const site = await this.prisma.site.findFirst({
        where: { id: dto.siteId, companyId, deletedAt: null },
      });
      if (!site) throw new BadRequestException('Site must belong to the same company');
    }

    // Insufficient stock check for reduction types
    const reducesStock = ['STOCK_OUT', 'TRANSFER', 'ADJUSTMENT_OUT', 'DAMAGED', 'LOST', 'FUEL_ISSUE'];
    if (reducesStock.includes(dto.movementType)) {
      if (item.currentQuantity < dto.quantity) {
        throw new BadRequestException(
          `Insufficient stock balance for ${item.itemName}. Available: ${item.currentQuantity} ${item.unit}, Required: ${dto.quantity} ${item.unit}`,
        );
      }
    }

    const unitCost = dto.unitCost !== undefined ? dto.unitCost : item.averageUnitCost;
    const totalCost = dto.quantity * unitCost;

    // Create movement
    const movement = await this.prisma.stockMovement.create({
      data: {
        companyId,
        inventoryItemId: dto.inventoryItemId,
        fromWarehouseId: dto.fromWarehouseId || item.defaultWarehouseId || null,
        toWarehouseId: dto.toWarehouseId || null,
        projectId: dto.projectId || null,
        siteId: dto.siteId || null,
        movementType: dto.movementType,
        quantity: dto.quantity,
        unitCost,
        totalCost,
        movementDate: dto.movementDate ? new Date(dto.movementDate) : new Date(),
        referenceNumber: dto.referenceNumber || null,
        reason: dto.reason || null,
        notes: dto.notes || null,
        fuelRequestId: dto.fuelRequestId || null,
        machineId: dto.machineId || null,
        requestedById: userId,
        approvedById: userId,
        issuedById: userId,
        createdById: userId,
      },
      include: {
        inventoryItem: true,
        fromWarehouse: true,
        toWarehouse: true,
        project: true,
        site: true,
      },
    });

    // Update item stock balance
    let qtyDelta = 0;
    if (['STOCK_IN', 'ADJUSTMENT_IN', 'RETURN'].includes(dto.movementType)) {
      qtyDelta = dto.quantity;
    } else if (reducesStock.includes(dto.movementType)) {
      qtyDelta = -dto.quantity;
    }

    const newQuantity = Math.max(0, item.currentQuantity + qtyDelta);
    let newStatus = item.status;
    if (newQuantity <= 0) newStatus = 'Out of Stock';
    else if (newQuantity <= item.minimumStockLevel) newStatus = 'Low Stock';
    else newStatus = 'Active';

    await this.prisma.inventoryItem.update({
      where: { id: item.id },
      data: {
        currentQuantity: newQuantity,
        totalValue: newQuantity * (item.averageUnitCost || unitCost),
        status: newStatus,
      },
    });

    return movement;
  }

  async updateMovement(id: string, companyId: string, userId: string, dto: UpdateStockMovementDto) {
    const movement = await this.findOneMovement(id, companyId);
    return this.prisma.stockMovement.update({
      where: { id: movement.id },
      data: {
        ...(dto.referenceNumber !== undefined && { referenceNumber: dto.referenceNumber }),
        ...(dto.reason !== undefined && { reason: dto.reason }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        updatedById: userId,
      },
      include: {
        inventoryItem: true,
        fromWarehouse: true,
        toWarehouse: true,
      },
    });
  }

  async softDeleteMovement(id: string, companyId: string) {
    await this.findOneMovement(id, companyId);
    return this.prisma.stockMovement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ----------------------------------------------------
  // MATERIAL / INVENTORY REQUESTS
  // ----------------------------------------------------

  async findRequests(companyId: string, query?: any) {
    return this.prisma.inventoryRequest.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(query?.status && { status: query.status }),
        ...(query?.projectId && { projectId: query.projectId }),
        ...(query?.siteId && { siteId: query.siteId }),
      },
      include: {
        project: { select: { id: true, projectName: true } },
        site: { select: { id: true, siteName: true } },
        inventoryItem: true,
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
        issuedBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneRequest(id: string, companyId: string) {
    const request = await this.prisma.inventoryRequest.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        project: true,
        site: true,
        inventoryItem: {
          include: {
            defaultWarehouse: true,
          },
        },
        requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        approvedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        issuedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!request) throw new NotFoundException('Inventory request not found');
    return request;
  }

  async createRequest(companyId: string, userId: string, dto: CreateInventoryRequestDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, companyId, deletedAt: null },
    });
    if (!project) throw new BadRequestException('Project must belong to the same company');

    const site = await this.prisma.site.findFirst({
      where: { id: dto.siteId, companyId, deletedAt: null },
    });
    if (!site) throw new BadRequestException('Site must belong to the same company');
    if (site.projectId !== dto.projectId) {
      throw new BadRequestException('Site must belong to the selected project');
    }

    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: dto.inventoryItemId, companyId, deletedAt: null },
    });
    if (!item) throw new BadRequestException('Inventory item must belong to the same company');

    return this.prisma.inventoryRequest.create({
      data: {
        companyId,
        projectId: dto.projectId,
        siteId: dto.siteId,
        inventoryItemId: dto.inventoryItemId,
        requestedById: userId,
        quantityRequested: dto.quantityRequested,
        priority: dto.priority || 'Normal',
        status: 'Pending',
        purpose: dto.purpose || null,
        notes: dto.notes || null,
        createdById: userId,
      },
      include: {
        project: true,
        site: true,
        inventoryItem: true,
        requestedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async updateRequest(id: string, companyId: string, userId: string, dto: any) {
    const request = await this.findOneRequest(id, companyId);
    if (request.status !== 'Pending') {
      throw new BadRequestException('Only Pending inventory requests can be edited');
    }
    return this.prisma.inventoryRequest.update({
      where: { id: request.id },
      data: {
        ...(dto.quantityRequested && { quantityRequested: dto.quantityRequested }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.purpose !== undefined && { purpose: dto.purpose }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        updatedById: userId,
      },
      include: {
        project: true,
        site: true,
        inventoryItem: true,
      },
    });
  }

  async approveRequest(id: string, companyId: string, userId: string, dto: ApproveInventoryRequestDto) {
    const request = await this.findOneRequest(id, companyId);
    if (request.status !== 'Pending') {
      throw new BadRequestException(`Cannot approve request with status "${request.status}"`);
    }

    return this.prisma.inventoryRequest.update({
      where: { id: request.id },
      data: {
        status: 'Approved',
        approvedById: userId,
        approvedAt: new Date(),
        quantityApproved: dto.quantityApproved,
        notes: dto.notes ? `${request.notes ? request.notes + '\n' : ''}Approval note: ${dto.notes}` : request.notes,
        updatedById: userId,
      },
      include: {
        project: true,
        site: true,
        inventoryItem: true,
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async rejectRequest(id: string, companyId: string, userId: string, dto: RejectInventoryRequestDto) {
    const request = await this.findOneRequest(id, companyId);
    if (request.status !== 'Pending') {
      throw new BadRequestException(`Cannot reject request with status "${request.status}"`);
    }

    return this.prisma.inventoryRequest.update({
      where: { id: request.id },
      data: {
        status: 'Rejected',
        approvedById: userId,
        rejectionReason: dto.rejectionReason,
        updatedById: userId,
      },
      include: {
        project: true,
        site: true,
        inventoryItem: true,
        approvedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async issueRequest(id: string, companyId: string, userId: string, dto: IssueInventoryRequestDto) {
    const request = await this.findOneRequest(id, companyId);
    if (request.status !== 'Approved' && request.status !== 'Partially Issued') {
      throw new BadRequestException('Request must be approved before issuing material');
    }

    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: request.inventoryItemId, companyId, deletedAt: null },
    });
    if (!item) throw new BadRequestException('Inventory item not found');

    if (item.currentQuantity < dto.quantityIssued) {
      throw new BadRequestException(
        `Insufficient stock available for issuance. Current stock: ${item.currentQuantity} ${item.unit}`,
      );
    }

    const totalIssued = request.quantityIssued + dto.quantityIssued;
    if (totalIssued > request.quantityApproved) {
      throw new BadRequestException(
        `Quantity issued (${totalIssued}) cannot exceed quantity approved (${request.quantityApproved})`,
      );
    }

    const status = totalIssued >= request.quantityApproved ? 'Issued' : 'Partially Issued';

    // Record stock movement for issuance
    await this.recordMovement(companyId, userId, {
      inventoryItemId: item.id,
      fromWarehouseId: dto.sourceWarehouseId || item.defaultWarehouseId || undefined,
      projectId: request.projectId,
      siteId: request.siteId,
      movementType: 'STOCK_OUT',
      quantity: dto.quantityIssued,
      unitCost: item.averageUnitCost,
      notes: dto.notes || `Issued for Request #${request.id.slice(0, 8)}`,
    });

    return this.prisma.inventoryRequest.update({
      where: { id: request.id },
      data: {
        quantityIssued: totalIssued,
        status,
        issuedById: userId,
        issuedAt: new Date(),
        notes: dto.notes ? `${request.notes ? request.notes + '\n' : ''}Issue note: ${dto.notes}` : request.notes,
        updatedById: userId,
      },
      include: {
        project: true,
        site: true,
        inventoryItem: true,
        issuedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  async softDeleteRequest(id: string, companyId: string) {
    await this.findOneRequest(id, companyId);
    return this.prisma.inventoryRequest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ----------------------------------------------------
  // INVENTORY REPORTS & ANALYTICS
  // ----------------------------------------------------

  async getSummaryReport(companyId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { companyId, deletedAt: null },
    });

    const totalItems = items.length;
    const totalStockValue = items.reduce((acc, i) => acc + (i.totalValue || i.currentQuantity * i.averageUnitCost), 0);
    const lowStockItems = items.filter((i) => i.currentQuantity > 0 && i.currentQuantity <= i.minimumStockLevel).length;
    const outOfStockItems = items.filter((i) => i.currentQuantity <= 0).length;

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const movementsThisMonth = await this.prisma.stockMovement.findMany({
      where: {
        companyId,
        deletedAt: null,
        movementDate: { gte: startOfMonth },
      },
    });

    const stockInThisMonth = movementsThisMonth
      .filter((m) => ['STOCK_IN', 'ADJUSTMENT_IN', 'RETURN'].includes(m.movementType))
      .reduce((acc, m) => acc + m.quantity, 0);

    const stockOutThisMonth = movementsThisMonth
      .filter((m) => ['STOCK_OUT', 'TRANSFER', 'ADJUSTMENT_OUT', 'DAMAGED', 'LOST', 'FUEL_ISSUE'].includes(m.movementType))
      .reduce((acc, m) => acc + m.quantity, 0);

    const pendingRequestsCount = await this.prisma.inventoryRequest.count({
      where: { companyId, status: 'Pending', deletedAt: null },
    });

    const recentMovements = await this.prisma.stockMovement.findMany({
      where: { companyId, deletedAt: null },
      take: 10,
      orderBy: { movementDate: 'desc' },
      include: {
        inventoryItem: { select: { itemName: true, unit: true } },
        fromWarehouse: { select: { warehouseName: true } },
        toWarehouse: { select: { warehouseName: true } },
        project: { select: { projectName: true } },
      },
    });

    const topItemsByValue = [...items]
      .sort((a, b) => (b.totalValue || 0) - (a.totalValue || 0))
      .slice(0, 5)
      .map((i) => ({
        id: i.id,
        itemName: i.itemName,
        category: i.category,
        currentQuantity: i.currentQuantity,
        unit: i.unit,
        totalValue: i.totalValue,
      }));

    return {
      totalItems,
      totalStockValue,
      lowStockItems,
      outOfStockItems,
      stockInThisMonth,
      stockOutThisMonth,
      pendingRequestsCount,
      topItemsByValue,
      recentMovements,
    };
  }

  async getByProjectReport(companyId: string) {
    const movements = await this.prisma.stockMovement.findMany({
      where: { companyId, projectId: { not: null }, deletedAt: null },
      include: {
        project: { select: { id: true, projectName: true } },
        inventoryItem: { select: { id: true, itemName: true, category: true, unit: true } },
      },
    });

    const projectMap: Record<string, { projectId: string; projectName: string; totalMovements: number; totalCost: number; items: Record<string, any> }> = {};

    movements.forEach((m) => {
      if (!m.project) return;
      const pid = m.project.id;
      if (!projectMap[pid]) {
        projectMap[pid] = {
          projectId: pid,
          projectName: m.project.projectName,
          totalMovements: 0,
          totalCost: 0,
          items: {},
        };
      }

      projectMap[pid].totalMovements += 1;
      projectMap[pid].totalCost += m.totalCost || 0;

      const iid = m.inventoryItem.id;
      if (!projectMap[pid].items[iid]) {
        projectMap[pid].items[iid] = {
          itemName: m.inventoryItem.itemName,
          category: m.inventoryItem.category,
          unit: m.inventoryItem.unit,
          quantity: 0,
          totalCost: 0,
        };
      }
      projectMap[pid].items[iid].quantity += m.quantity;
      projectMap[pid].items[iid].totalCost += m.totalCost || 0;
    });

    return Object.values(projectMap).map((p) => ({
      ...p,
      items: Object.values(p.items),
    }));
  }

  async getBySiteReport(companyId: string) {
    const movements = await this.prisma.stockMovement.findMany({
      where: { companyId, siteId: { not: null }, deletedAt: null },
      include: {
        site: { select: { id: true, siteName: true } },
        inventoryItem: { select: { id: true, itemName: true, category: true } },
      },
    });

    const siteMap: Record<string, { siteId: string; siteName: string; totalCost: number; movementsCount: number }> = {};

    movements.forEach((m) => {
      if (!m.site) return;
      const sid = m.site.id;
      if (!siteMap[sid]) {
        siteMap[sid] = {
          siteId: sid,
          siteName: m.site.siteName,
          totalCost: 0,
          movementsCount: 0,
        };
      }
      siteMap[sid].totalCost += m.totalCost || 0;
      siteMap[sid].movementsCount += 1;
    });

    return Object.values(siteMap);
  }

  async getByItemReport(companyId: string) {
    const items = await this.prisma.inventoryItem.findMany({
      where: { companyId, deletedAt: null },
      include: {
        defaultWarehouse: { select: { warehouseName: true } },
      },
      orderBy: { totalValue: 'desc' },
    });

    return items.map((i) => ({
      id: i.id,
      itemName: i.itemName,
      itemCode: i.itemCode,
      category: i.category,
      unit: i.unit,
      currentQuantity: i.currentQuantity,
      averageUnitCost: i.averageUnitCost,
      totalValue: i.totalValue,
      status: i.status,
      warehouseName: i.defaultWarehouse?.warehouseName || 'Unassigned',
    }));
  }

  async getLowStockReport(companyId: string) {
    return this.prisma.inventoryItem.findMany({
      where: {
        companyId,
        deletedAt: null,
        OR: [
          { status: 'Low Stock' },
          { status: 'Out of Stock' },
        ],
      },
      include: {
        defaultWarehouse: true,
      },
      orderBy: { currentQuantity: 'asc' },
    });
  }
}
