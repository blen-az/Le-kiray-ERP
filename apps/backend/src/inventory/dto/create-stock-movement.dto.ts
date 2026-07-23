import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsEnum, IsUUID, NotEquals } from 'class-validator';

export class CreateStockMovementDto {
  @ApiProperty({ example: 'test-item-uuid', description: 'Target inventory item ID' })
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId!: string;

  @ApiProperty({ example: 'test-warehouse-uuid', description: 'Origin/target storehouse ID' })
  @IsUUID()
  @IsNotEmpty()
  warehouseId!: string;

  @ApiProperty({ example: 'test-project-uuid', description: 'Destination project ID mapping (if dispatched to site)', required: false })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ example: 'test-site-uuid', description: 'Destination site location ID (if dispatched to site)', required: false })
  @IsUUID()
  @IsOptional()
  siteId?: string;

  @ApiProperty({ example: 50, description: 'Material volume change (positive for in, negative for out/dispatches)' })
  @IsNumber()
  @NotEquals(0)
  @IsNotEmpty()
  quantity!: number;

  @ApiProperty({ example: 'STOCK_IN', description: 'Movement transaction classification', enum: ['STOCK_IN', 'STOCK_OUT', 'TRANSFER'] })
  @IsEnum(['STOCK_IN', 'STOCK_OUT', 'TRANSFER'])
  @IsNotEmpty()
  movementType!: 'STOCK_IN' | 'STOCK_OUT' | 'TRANSFER';
}
