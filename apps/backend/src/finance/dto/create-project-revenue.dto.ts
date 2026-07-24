import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectRevenueDto {
  @ApiProperty({ description: 'Target project ID' })
  @IsString()
  projectId: string;

  @ApiProperty({ description: 'Revenue / Contract entry amount in ETB', example: 5000000.0 })
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'ETB' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Revenue / Invoice date', example: '2026-07-24' })
  @IsDateString()
  revenueDate: string;

  @ApiPropertyOptional({ description: 'Description or milestone details' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Client or employer name' })
  @IsOptional()
  @IsString()
  clientName?: string;

  @ApiPropertyOptional({ description: 'Invoice or IPC reference number' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Revenue status', default: 'Recorded' })
  @IsOptional()
  @IsString()
  status?: string;
}
