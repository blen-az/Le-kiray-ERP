import { Controller, Get, Post, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { CreateInventoryItemDto } from './dto/create-inventory-item.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

@ApiTags('Inventory & Warehousing')
@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('warehouses')
  @Permissions('projects:view')
  @ApiOperation({ summary: 'Get all company warehouses / site stores' })
  findAllWarehouses(@CurrentUser('companyId') companyId: string) {
    return this.inventoryService.findAllWarehouses(companyId);
  }

  @Post('warehouses')
  @Permissions('inventory:stock_in')
  @ApiOperation({ summary: 'Create a new warehouse / site store' })
  createWarehouse(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createWarehouseDto: CreateWarehouseDto,
  ) {
    return this.inventoryService.createWarehouse(user.companyId, {
      ...createWarehouseDto,
      createdById: user.id,
    });
  }

  @Get('items')
  @Permissions('projects:view')
  @ApiOperation({ summary: 'List all inventory items and quantities' })
  findAllItems(@CurrentUser('companyId') companyId: string) {
    return this.inventoryService.findAllItems(companyId);
  }

  @Post('items')
  @Permissions('inventory:stock_in')
  @ApiOperation({ summary: 'Register a new inventory item template' })
  createItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createInventoryItemDto: CreateInventoryItemDto,
  ) {
    return this.inventoryService.createItem(user.companyId, {
      ...createInventoryItemDto,
      createdById: user.id,
    });
  }

  @Get('movements')
  @Permissions('projects:view')
  @ApiOperation({ summary: 'Get recent material audit logs' })
  findMovements(@CurrentUser('companyId') companyId: string) {
    return this.inventoryService.findMovements(companyId);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Record material dispatch, arrival, or transfer logs' })
  recordMovement(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createStockMovementDto: CreateStockMovementDto,
  ) {
    // Dynamic permission check based on transfer direction
    const requiredPermission = createStockMovementDto.movementType === 'STOCK_IN' 
      ? 'inventory:stock_in' 
      : 'inventory:stock_out';
      
    if (!user.permissions.includes(requiredPermission) && !user.roles.includes('Super Admin')) {
      throw new ForbiddenException(`You do not have the required permission (${requiredPermission}) to perform this action`);
    }

    return this.inventoryService.recordMovement(user.companyId, {
      ...createStockMovementDto,
      approvedById: user.id,
      createdById: user.id,
    });
  }
}
