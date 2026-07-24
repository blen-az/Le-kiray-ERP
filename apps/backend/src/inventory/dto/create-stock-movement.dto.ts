import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsUUID, IsDateString } from 'class-validator';

export const STOCK_MOVEMENT_TYPES = [
  'STOCK_IN',
  'STOCK_OUT',
  'TRANSFER',
  'ADJUSTMENT_IN',
  'ADJUSTMENT_OUT',
  'RETURN',
  'DAMAGED',
  'LOST',
  'FUEL_ISSUE',
] as const;

export class CreateStockMovementDto {
  @ApiProperty({ description: 'Inventory Item ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Inventory item is required' })
  inventoryItemId: string;

  @ApiPropertyOptional({ description: 'Source Warehouse ID (Required for STOCK_OUT, TRANSFER, DAMAGED, LOST, FUEL_ISSUE)' })
  @IsUUID()
  @IsOptional()
  fromWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Destination Warehouse ID (Required for STOCK_IN, TRANSFER, RETURN)' })
  @IsUUID()
  @IsOptional()
  toWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Associated Project ID' })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Associated Site ID' })
  @IsUUID()
  @IsOptional()
  siteId?: string;

  @ApiProperty({ description: 'Type of movement', example: 'STOCK_IN' })
  @IsString()
  @IsNotEmpty({ message: 'Movement type is required' })
  movementType: string;

  @ApiProperty({ description: 'Quantity to move (must be > 0)', example: 100 })
  @IsNumber()
  @Min(0.0001, { message: 'Quantity must be greater than 0' })
  quantity: number;

  @ApiPropertyOptional({ description: 'Unit cost of item', example: 850.0, default: 0 })
  @IsNumber()
  @Min(0, { message: 'Unit cost cannot be negative' })
  @IsOptional()
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Date of movement', default: 'Current timestamp' })
  @IsDateString()
  @IsOptional()
  movementDate?: string;

  @ApiPropertyOptional({ description: 'Reference PO/Waybill/Dispatch number' })
  @IsString()
  @IsOptional()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Reason for movement or adjustment' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Additional operational notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Associated Fuel Request ID if applicable' })
  @IsUUID()
  @IsOptional()
  fuelRequestId?: string;

  @ApiPropertyOptional({ description: 'Associated Machine ID if issuing fuel or spare parts' })
  @IsUUID()
  @IsOptional()
  machineId?: string;
}
