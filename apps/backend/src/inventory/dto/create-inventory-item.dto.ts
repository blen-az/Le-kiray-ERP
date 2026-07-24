import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsBoolean, IsUUID, IsIn } from 'class-validator';

export const INVENTORY_CATEGORIES = [
  'Cement',
  'Rebar',
  'Sand',
  'Aggregate',
  'Diesel',
  'Spare Parts',
  'Tools',
  'PPE',
  'Electrical Materials',
  'Plumbing Materials',
  'Finishing Materials',
  'Fuel and Lubricants',
  'Other',
] as const;

export const INVENTORY_UNITS = [
  'Bag',
  'Kg',
  'Ton',
  'Liter',
  'Meter',
  'Piece',
  'Box',
  'Roll',
  'Set',
  'Truckload',
  'Cubic Meter',
  'Other',
] as const;

export class CreateInventoryItemDto {
  @ApiProperty({ description: 'Name of the material or tool', example: 'Cement 50kg' })
  @IsString()
  @IsNotEmpty()
  itemName: string;

  @ApiPropertyOptional({ description: 'Unique material code or SKU', example: 'MAT-CEM-001' })
  @IsString()
  @IsOptional()
  itemCode?: string;

  @ApiProperty({ description: 'Item category', example: 'Cement' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: 'Unit of measurement', example: 'Bag' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiPropertyOptional({ description: 'Detailed item specifications' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Initial or current stock balance', example: 500, default: 0 })
  @IsNumber()
  @Min(0, { message: 'Current quantity cannot be negative' })
  @IsOptional()
  currentQuantity?: number;

  @ApiPropertyOptional({ description: 'Minimum stock level before low stock alert', example: 50, default: 0 })
  @IsNumber()
  @Min(0, { message: 'Minimum stock level cannot be negative' })
  @IsOptional()
  minimumStockLevel?: number;

  @ApiPropertyOptional({ description: 'Maximum recommended stock capacity', example: 2000 })
  @IsNumber()
  @Min(0, { message: 'Maximum stock level cannot be negative' })
  @IsOptional()
  maximumStockLevel?: number;

  @ApiPropertyOptional({ description: 'Average purchase unit cost in ETB', example: 850.0, default: 0 })
  @IsNumber()
  @Min(0, { message: 'Average unit cost cannot be negative' })
  @IsOptional()
  averageUnitCost?: number;

  @ApiPropertyOptional({ description: 'Default store/warehouse ID where item is stocked' })
  @IsUUID()
  @IsOptional()
  defaultWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Whether this item represents fuel/diesel', default: false })
  @IsBoolean()
  @IsOptional()
  isFuelItem?: boolean;

  @ApiPropertyOptional({ description: 'Whether this item is a consumable asset', default: false })
  @IsBoolean()
  @IsOptional()
  isConsumable?: boolean;

  @ApiPropertyOptional({ description: 'Whether this item is a reusable tool', default: false })
  @IsBoolean()
  @IsOptional()
  isTool?: boolean;

  @ApiPropertyOptional({ description: 'Whether this item is a machine spare part', default: false })
  @IsBoolean()
  @IsOptional()
  isSparePart?: boolean;

  @ApiPropertyOptional({ description: 'Status of the item', example: 'Active', default: 'Active' })
  @IsString()
  @IsOptional()
  status?: string;
}
