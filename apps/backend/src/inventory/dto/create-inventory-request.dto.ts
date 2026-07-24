import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsUUID } from 'class-validator';

export const INVENTORY_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'] as const;

export class CreateInventoryRequestDto {
  @ApiProperty({ description: 'Target Project ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId: string;

  @ApiProperty({ description: 'Target Site ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Site ID is required' })
  siteId: string;

  @ApiProperty({ description: 'Requested Inventory Item ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Inventory item is required' })
  inventoryItemId: string;

  @ApiProperty({ description: 'Quantity requested (must be > 0)', example: 100 })
  @IsNumber()
  @Min(0.0001, { message: 'Quantity requested must be greater than 0' })
  quantityRequested: number;

  @ApiProperty({ description: 'Request priority', example: 'Normal', default: 'Normal' })
  @IsString()
  @IsNotEmpty({ message: 'Priority is required' })
  priority: string;

  @ApiPropertyOptional({ description: 'Purpose or work description for material request' })
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiPropertyOptional({ description: 'Additional notes or requirements' })
  @IsString()
  @IsOptional()
  notes?: string;
}
