import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, IsUUID, IsDateString, IsString } from 'class-validator';

export class UpdateFuelLogDto {
  @ApiProperty({ example: 'test-project-uuid', required: false })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ example: 'test-site-uuid', required: false })
  @IsUUID()
  @IsOptional()
  siteId?: string;

  @ApiProperty({ example: 'test-machine-uuid', required: false })
  @IsUUID()
  @IsOptional()
  machineId?: string;

  @ApiProperty({ example: 'test-operator-uuid', required: false })
  @IsUUID()
  @IsOptional()
  operatorId?: string;

  @ApiProperty({ example: 150, required: false })
  @IsNumber()
  @Min(0.01, { message: 'Liters used must be greater than 0' })
  @IsOptional()
  litersUsed?: number;

  @ApiProperty({ example: 110.50, required: false })
  @IsNumber()
  @Min(0, { message: 'Cost per liter cannot be negative' })
  @IsOptional()
  costPerLiter?: number;

  @ApiProperty({ example: '2026-07-23', required: false })
  @IsDateString()
  @IsOptional()
  usageDate?: string;

  @ApiProperty({ example: 8.0, required: false })
  @IsNumber()
  @Min(0, { message: 'Working hours cannot be negative' })
  @IsOptional()
  workingHours?: number;

  @ApiProperty({ example: 2840.1, required: false })
  @IsNumber()
  @Min(0, { message: 'Odometer/Hourmeter reading cannot be negative' })
  @IsOptional()
  odometerOrHourMeterReading?: number;

  @ApiProperty({ example: 'http://bucket.com/receipts/fuel234.jpg', required: false })
  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @ApiProperty({ example: 'Updated remarks', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
