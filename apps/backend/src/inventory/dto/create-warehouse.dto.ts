import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Bole Central Store', description: 'Name of the warehouse compound' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Bole, Addis Ababa', description: 'Physical address of the warehouse', required: false })
  @IsString()
  @IsOptional()
  location?: string;
}
