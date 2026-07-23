import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findAllWarehouses(companyId: string) {
    return this.prisma.warehouse.findMany({
      where: { companyId, deletedAt: null },
      include: {
        inventoryItems: {
          where: { deletedAt: null },
        },
      },
    });
  }

  async createWarehouse(companyId: string, data: { name: string; location?: string; createdById?: string }) {
    return this.prisma.warehouse.create({
      data: {
        companyId,
        name: data.name,
        location: data.location,
        createdById: data.createdById,
      },
    });
  }

  async findAllItems(companyId: string) {
    return this.prisma.inventoryItem.findMany({
      where: { companyId, deletedAt: null },
      include: {
        warehouse: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createItem(companyId: string, data: { warehouseId: string; name: string; category: string; unit: string; minStockAlert?: number; createdById?: string }) {
    // Hardening: Verify warehouse belongs to this company
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: data.warehouseId, companyId },
    });
    if (!warehouse) {
      throw new BadRequestException('Warehouse not found in this company workspace');
    }

    return this.prisma.inventoryItem.create({
      data: {
        companyId,
        warehouseId: data.warehouseId,
        name: data.name,
        category: data.category,
        unit: data.unit,
        minStockAlert: data.minStockAlert ?? 10.0,
        createdById: data.createdById,
      },
    });
  }

  async recordMovement(
    companyId: string,
    data: {
      inventoryItemId: string;
      warehouseId: string;
      projectId?: string;
      siteId?: string;
      quantity: number;
      movementType: 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER';
      approvedById?: string;
      createdById?: string;
    },
  ) {
    // 1. Verify item belongs to this company
    const item = await this.prisma.inventoryItem.findFirst({
      where: { id: data.inventoryItemId, companyId },
    });
    if (!item) {
      throw new BadRequestException('Inventory item not found in this company workspace');
    }

    // 2. Verify warehouse belongs to this company
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: data.warehouseId, companyId },
    });
    if (!warehouse) {
      throw new BadRequestException('Warehouse not found in this company workspace');
    }

    // 3. Verify project belongs to this company
    if (data.projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: data.projectId, companyId },
      });
      if (!project) {
        throw new BadRequestException('Project not found in this company workspace');
      }
    }

    // 4. Verify site belongs to this company
    if (data.siteId) {
      const site = await this.prisma.site.findFirst({
        where: { id: data.siteId, companyId },
      });
      if (!site) {
        throw new BadRequestException('Site not found in this company workspace');
      }
    }

    // Check balance for stock-out transactions
    if (data.quantity < 0 && item.quantity + data.quantity < 0) {
      throw new BadRequestException(`Insufficient stock. Current balance: ${item.quantity} ${item.unit}`);
    }

    // 1. Log transaction
    const movement = await this.prisma.stockMovement.create({
      data: {
        companyId,
        inventoryItemId: data.inventoryItemId,
        warehouseId: data.warehouseId,
        projectId: data.projectId || null,
        siteId: data.siteId || null,
        quantity: data.quantity,
        movementType: data.movementType,
        approvedById: data.approvedById || null,
        createdById: data.createdById,
      },
    });

    // 2. Adjust balance
    await this.prisma.inventoryItem.update({
      where: { id: data.inventoryItemId },
      data: {
        quantity: {
          increment: data.quantity,
        },
      },
    });

    return movement;
  }

  async findMovements(companyId: string) {
    return this.prisma.stockMovement.findMany({
      where: { companyId, deletedAt: null },
      include: {
        inventoryItem: true,
        warehouse: true,
        project: true,
        site: true,
        approvedBy: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
