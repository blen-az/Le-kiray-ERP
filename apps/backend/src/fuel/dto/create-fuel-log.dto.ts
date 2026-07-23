import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, IsUUID, IsDateString, IsString, IsOptional } from 'class-validator';

export class CreateFuelLogDto {
  @ApiProperty({ example: 'test-project-uuid', description: 'Project ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId!: string;

  @ApiProperty({ example: 'test-site-uuid', description: 'Site ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Site ID is required' })
  siteId!: string;

  @ApiProperty({ example: 'test-machine-uuid', description: 'Machine ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Machine ID is required' })
  machineId!: string;

  @ApiProperty({ example: 'test-operator-uuid', description: 'Operator ID', required: false })
  @IsUUID()
  @IsOptional()
  operatorId?: string;

  @ApiProperty({ example: 150, description: 'Liters used' })
  @IsNumber()
  @Min(0.01, { message: 'Liters used must be greater than 0' })
  @IsNotEmpty({ message: 'Liters used is required' })
  litersUsed!: number;

  @ApiProperty({ example: 110.50, description: 'Cost per liter in ETB' })
  @IsNumber()
  @Min(0, { message: 'Cost per liter cannot be negative' })
  @IsNotEmpty({ message: 'Cost per liter is required' })
  costPerLiter!: number;

  @ApiProperty({ example: '2026-07-23', description: 'Date of usage' })
  @IsDateString()
  @IsNotEmpty({ message: 'Usage date is required' })
  usageDate!: string;

  @ApiProperty({ example: 8.0, description: 'Hours of engine work logged', required: false })
  @IsNumber()
  @Min(0, { message: 'Working hours cannot be negative' })
  @IsOptional()
  workingHours?: number;

  @ApiProperty({ example: 2840.1, description: 'Odometer/Hourmeter reading', required: false })
  @IsNumber()
  @Min(0, { message: 'Hour meter or odometer reading cannot be negative' })
  @IsOptional()
  odometerOrHourMeterReading?: number;

  @ApiProperty({ example: 'http://bucket.com/receipts/fuel234.jpg', required: false })
  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @ApiProperty({ example: 'Logged at site pump', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
