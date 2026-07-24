import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';

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

@ApiTags('Inventory Management')
@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ----------------------------------------------------
  // REPORTS (Place specific sub-paths above :id endpoints)
  // ----------------------------------------------------

  @Get('reports/summary')
  @Permissions('inventory:reports', 'inventory:view')
  @ApiOperation({ summary: 'Get overall inventory dashboard summary report' })
  getSummaryReport(@CurrentUser('companyId') companyId: string) {
    return this.inventoryService.getSummaryReport(companyId);
  }

  @Get('reports/by-project')
  @Permissions('inventory:reports', 'inventory:view')
  @ApiOperation({ summary: 'Get material usage report grouped by project' })
  getByProjectReport(@CurrentUser('companyId') companyId: string) {
    return this.inventoryService.getByProjectReport(companyId);
  }

  @Get('reports/by-site')
  @Permissions('inventory:reports', 'inventory:view')
  @ApiOperation({ summary: 'Get material usage report grouped by site' })
  getBySiteReport(@CurrentUser('companyId') companyId: string) {
    return this.inventoryService.getBySiteReport(companyId);
  }

  @Get('reports/by-item')
  @Permissions('inventory:reports', 'inventory:view')
  @ApiOperation({ summary: 'Get inventory stock balance report grouped by item' })
  getByItemReport(@CurrentUser('companyId') companyId: string) {
    return this.inventoryService.getByItemReport(companyId);
  }

  @Get('reports/low-stock')
  @Permissions('inventory:reports', 'inventory:view')
  @ApiOperation({ summary: 'Get low-stock and out-of-stock alert report' })
  getLowStockReport(@CurrentUser('companyId') companyId: string) {
    return this.inventoryService.getLowStockReport(companyId);
  }

  // ----------------------------------------------------
  // WAREHOUSES & SITE STORES
  // ----------------------------------------------------

  @Get('warehouses')
  @Permissions('inventory:view', 'projects:view')
  @ApiOperation({ summary: 'List company warehouses and site stores' })
  findAllWarehouses(@CurrentUser('companyId') companyId: string) {
    return this.inventoryService.findAllWarehouses(companyId);
  }

  @Post('warehouses')
  @Permissions('inventory:create')
  @ApiOperation({ summary: 'Create a new warehouse or site store' })
  createWarehouse(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWarehouseDto,
  ) {
    return this.inventoryService.createWarehouse(user.companyId, user.id, dto);
  }

  @Get('warehouses/:id')
  @Permissions('inventory:view', 'projects:view')
  @ApiOperation({ summary: 'Get warehouse details by ID' })
  findOneWarehouse(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.inventoryService.findOneWarehouse(id, companyId);
  }

  @Patch('warehouses/:id')
  @Permissions('inventory:update')
  @ApiOperation({ summary: 'Update warehouse or site store' })
  updateWarehouse(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.inventoryService.updateWarehouse(id, user.companyId, user.id, dto);
  }

  @Delete('warehouses/:id')
  @Permissions('inventory:delete')
  @ApiOperation({ summary: 'Soft delete a warehouse' })
  deleteWarehouse(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.inventoryService.softDeleteWarehouse(id, companyId);
  }

  // ----------------------------------------------------
  // INVENTORY ITEMS
  // ----------------------------------------------------

  @Get('items')
  @Permissions('inventory:view', 'projects:view')
  @ApiOperation({ summary: 'List all inventory material items' })
  findAllItems(@CurrentUser('companyId') companyId: string) {
    return this.inventoryService.findAllItems(companyId);
  }

  @Post('items')
  @Permissions('inventory:create')
  @ApiOperation({ summary: 'Register a new inventory item' })
  createItem(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInventoryItemDto,
  ) {
    return this.inventoryService.createItem(user.companyId, user.id, dto);
  }

  @Get('items/:id')
  @Permissions('inventory:view', 'projects:view')
  @ApiOperation({ summary: 'Get inventory item details by ID' })
  findOneItem(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.inventoryService.findOneItem(id, companyId);
  }

  @Patch('items/:id')
  @Permissions('inventory:update')
  @ApiOperation({ summary: 'Update an inventory item' })
  updateItem(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateInventoryItemDto,
  ) {
    return this.inventoryService.updateItem(id, user.companyId, user.id, dto);
  }

  @Delete('items/:id')
  @Permissions('inventory:delete')
  @ApiOperation({ summary: 'Soft delete an inventory item' })
  deleteItem(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.inventoryService.softDeleteItem(id, companyId);
  }

  // ----------------------------------------------------
  // STOCK MOVEMENTS
  // ----------------------------------------------------

  @Get('movements')
  @Permissions('inventory:view', 'projects:view')
  @ApiQuery({ name: 'movementType', required: false })
  @ApiQuery({ name: 'inventoryItemId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiOperation({ summary: 'List stock movements and audit records' })
  findMovements(
    @CurrentUser('companyId') companyId: string,
    @Query() query: any,
  ) {
    return this.inventoryService.findMovements(companyId, query);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Record a stock-in, stock-out, transfer, or adjustment' })
  recordMovement(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStockMovementDto,
  ) {
    // Permission validation based on movement type
    let reqPerm = 'inventory:stock_in';
    if (['STOCK_OUT', 'DAMAGED', 'LOST', 'FUEL_ISSUE'].includes(dto.movementType)) {
      reqPerm = 'inventory:stock_out';
    } else if (dto.movementType === 'TRANSFER') {
      reqPerm = 'inventory:transfer';
    } else if (['ADJUSTMENT_IN', 'ADJUSTMENT_OUT'].includes(dto.movementType)) {
      reqPerm = 'inventory:adjust';
    }

    const isSuperAdmin = user.roles && user.roles.includes('Super Admin');
    const hasPerm = user.permissions && (user.permissions.includes(reqPerm) || user.permissions.includes('inventory:create'));

    if (!hasPerm && !isSuperAdmin) {
      throw new ForbiddenException(`Missing required permission (${reqPerm}) to record this movement`);
    }

    return this.inventoryService.recordMovement(user.companyId, user.id, dto);
  }

  @Get('movements/:id')
  @Permissions('inventory:view', 'projects:view')
  @ApiOperation({ summary: 'Get stock movement details by ID' })
  findOneMovement(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.inventoryService.findOneMovement(id, companyId);
  }

  @Patch('movements/:id')
  @Permissions('inventory:update')
  @ApiOperation({ summary: 'Update stock movement notes or reference' })
  updateMovement(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateStockMovementDto,
  ) {
    return this.inventoryService.updateMovement(id, user.companyId, user.id, dto);
  }

  @Delete('movements/:id')
  @Permissions('inventory:delete')
  @ApiOperation({ summary: 'Soft delete a stock movement' })
  deleteMovement(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.inventoryService.softDeleteMovement(id, companyId);
  }

  // ----------------------------------------------------
  // MATERIAL REQUESTS
  // ----------------------------------------------------

  @Get('requests')
  @Permissions('inventory:view', 'projects:view')
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiOperation({ summary: 'List site material requests' })
  findRequests(
    @CurrentUser('companyId') companyId: string,
    @Query() query: any,
  ) {
    return this.inventoryService.findRequests(companyId, query);
  }

  @Post('requests')
  @Permissions('inventory:request')
  @ApiOperation({ summary: 'Submit a new material request' })
  createRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInventoryRequestDto,
  ) {
    return this.inventoryService.createRequest(user.companyId, user.id, dto);
  }

  @Get('requests/:id')
  @Permissions('inventory:view', 'projects:view')
  @ApiOperation({ summary: 'Get material request details by ID' })
  findOneRequest(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.inventoryService.findOneRequest(id, companyId);
  }

  @Patch('requests/:id')
  @Permissions('inventory:request', 'inventory:update')
  @ApiOperation({ summary: 'Update pending material request' })
  updateRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: any,
  ) {
    return this.inventoryService.updateRequest(id, user.companyId, user.id, dto);
  }

  @Post('requests/:id/approve')
  @Permissions('inventory:approve')
  @ApiOperation({ summary: 'Approve a material request' })
  approveRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApproveInventoryRequestDto,
  ) {
    return this.inventoryService.approveRequest(id, user.companyId, user.id, dto);
  }

  @Post('requests/:id/reject')
  @Permissions('inventory:reject')
  @ApiOperation({ summary: 'Reject a material request' })
  rejectRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectInventoryRequestDto,
  ) {
    return this.inventoryService.rejectRequest(id, user.companyId, user.id, dto);
  }

  @Post('requests/:id/issue')
  @Permissions('inventory:issue')
  @ApiOperation({ summary: 'Issue material for an approved request' })
  issueRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: IssueInventoryRequestDto,
  ) {
    return this.inventoryService.issueRequest(id, user.companyId, user.id, dto);
  }

  @Delete('requests/:id')
  @Permissions('inventory:delete')
  @ApiOperation({ summary: 'Soft delete a material request' })
  deleteRequest(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.inventoryService.softDeleteRequest(id, companyId);
  }
}
