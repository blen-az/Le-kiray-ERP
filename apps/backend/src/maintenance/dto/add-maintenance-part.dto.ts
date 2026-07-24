import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class AddMaintenancePartDto {
  @ApiProperty({ example: 'inventory-item-uuid', description: 'Spare part or tool inventory item ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Inventory item ID is required' })
  inventoryItemId!: string;

  @ApiProperty({ example: 2.0, description: 'Quantity used' })
  @IsNumber()
  @Min(0.01, { message: 'Quantity used must be greater than 0' })
  quantityUsed!: number;

  @ApiPropertyOptional({ example: 6250.0, description: 'Unit cost of part' })
  @IsNumber()
  @Min(0, { message: 'Unit cost cannot be negative' })
  @IsOptional()
  unitCost?: number;

  @ApiPropertyOptional({ example: 'Replaced both primary hydraulic filters' })
  @IsString()
  @IsOptional()
  notes?: string;
}
