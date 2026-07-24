import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsIn } from 'class-validator';

export const WAREHOUSE_TYPES = [
  'Main Warehouse',
  'Site Store',
  'Fuel Store',
  'Tool Store',
  'Spare Parts Store',
  'Temporary Store',
] as const;

export class CreateWarehouseDto {
  @ApiProperty({ description: 'Name of the warehouse or store', example: 'Bole Site Store' })
  @IsString()
  @IsNotEmpty({ message: 'Warehouse name is required' })
  warehouseName: string;

  @ApiPropertyOptional({ description: 'Unique code for the warehouse', example: 'WH-BOLE-01' })
  @IsString()
  @IsOptional()
  warehouseCode?: string;

  @ApiProperty({ description: 'Warehouse classification type', example: 'Site Store' })
  @IsString()
  @IsNotEmpty({ message: 'Warehouse type is required' })
  type: string;

  @ApiPropertyOptional({ description: 'Associated Project ID (required for Site Store)' })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Associated Site ID (required for Site Store)' })
  @IsUUID()
  @IsOptional()
  siteId?: string;

  @ApiPropertyOptional({ description: 'Physical address or location' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ description: 'Warehouse Manager / Storekeeper User ID' })
  @IsUUID()
  @IsOptional()
  managerId?: string;

  @ApiPropertyOptional({ description: 'Status of warehouse', example: 'Active', default: 'Active' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Additional notes or access instructions' })
  @IsString()
  @IsOptional()
  notes?: string;
}
