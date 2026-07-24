import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddMaintenancePartDto } from './add-maintenance-part.dto';

export class CompleteMaintenanceDto {
  @ApiPropertyOptional({ example: 'Ruptured high-pressure 3/4 inch hydraulic line.' })
  @IsString()
  @IsOptional()
  diagnosis?: string;

  @ApiPropertyOptional({ example: 'Replaced hydraulic line hose and topped up 25L hydraulic oil.' })
  @IsString()
  @IsOptional()
  workPerformed?: string;

  @ApiPropertyOptional({ example: 12500.0 })
  @IsNumber()
  @Min(0, { message: 'Parts cost cannot be negative' })
  @IsOptional()
  partsUsedValue?: number;

  @ApiPropertyOptional({ example: 4500.0 })
  @IsNumber()
  @Min(0, { message: 'Labor cost cannot be negative' })
  @IsOptional()
  laborCost?: number;

  @ApiPropertyOptional({ example: 0.0 })
  @IsNumber()
  @Min(0, { message: 'External service cost cannot be negative' })
  @IsOptional()
  externalServiceCost?: number;

  @ApiPropertyOptional({ example: 6.5 })
  @IsNumber()
  @Min(0, { message: 'Downtime hours cannot be negative' })
  @IsOptional()
  downtimeHours?: number;

  @ApiPropertyOptional({ example: '2026-07-24T15:30:00.000Z' })
  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @ApiPropertyOptional({ example: '2026-08-24' })
  @IsDateString()
  @IsOptional()
  nextServiceDate?: string;

  @ApiPropertyOptional({ example: 'Maintenance completed successfully. Machine tested under full load.' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [AddMaintenancePartDto], description: 'List of spare parts issued from inventory' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddMaintenancePartDto)
  @IsOptional()
  partsUsed?: AddMaintenancePartDto[];
}
