import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateInventoryItemDto {
  @ApiProperty({ example: 'test-warehouse-uuid', description: 'Warehouse ID where the item is stored' })
  @IsUUID()
  @IsNotEmpty()
  warehouseId!: string;

  @ApiProperty({ example: 'Cement 50kg', description: 'Item identifier name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'CEMENT', description: 'Category grouping classification' })
  @IsString()
  @IsNotEmpty()
  category!: string;

  @ApiProperty({ example: 'BAGS', description: 'Physical unit of measurement' })
  @IsString()
  @IsNotEmpty()
  unit!: string;

  @ApiProperty({ example: 10, description: 'Minimum stock count before flagging warnings', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minStockAlert?: number;
}
