import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
  Min,
  IsIn,
} from 'class-validator';

export const MAINTENANCE_TYPES = [
  'Preventive Maintenance',
  'Corrective Maintenance',
  'Breakdown Repair',
  'Inspection',
  'Oil Change',
  'Tire Service',
  'Hydraulic Service',
  'Electrical Repair',
  'Engine Repair',
  'General Service',
  'Other',
] as const;

export const MAINTENANCE_STATUSES = [
  'Reported',
  'Scheduled',
  'In Progress',
  'Completed',
  'Cancelled',
  'Deferred',
] as const;

export const MAINTENANCE_PRIORITIES = [
  'Low',
  'Normal',
  'High',
  'Urgent',
  'Critical',
] as const;

export class CreateMaintenanceDto {
  @ApiProperty({ example: 'machine-uuid', description: 'Associated heavy equipment machine ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Machine ID is required' })
  machineId!: string;

  @ApiPropertyOptional({ example: 'project-uuid', description: 'Associated project ID' })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ example: 'site-uuid', description: 'Associated site location ID' })
  @IsUUID()
  @IsOptional()
  siteId?: string;

  @ApiPropertyOptional({ example: 'employee-uuid', description: 'Assigned mechanic employee ID' })
  @IsUUID()
  @IsOptional()
  assignedMechanicId?: string;

  @ApiProperty({ example: 'Breakdown Repair', enum: MAINTENANCE_TYPES })
  @IsString()
  @IsNotEmpty({ message: 'Maintenance type is required' })
  maintenanceType!: string;

  @ApiPropertyOptional({ example: 'Reported', enum: MAINTENANCE_STATUSES })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'High', enum: MAINTENANCE_PRIORITIES })
  @IsString()
  @IsNotEmpty({ message: 'Priority is required' })
  priority!: string;

  @ApiProperty({ example: 'Hydraulic Hose Leak on Main Boom', description: 'Summary title of the issue' })
  @IsString()
  @IsNotEmpty({ message: 'Issue title is required' })
  issueTitle!: string;

  @ApiPropertyOptional({ example: 'Main boom arm hydraulic hose ruptured during heavy excavation.' })
  @IsString()
  @IsOptional()
  issueDescription?: string;

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

  @ApiProperty({ example: '2026-07-24', description: 'Reported date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty({ message: 'Reported date is required' })
  reportedDate!: string;

  @ApiPropertyOptional({ example: '2026-07-25', description: 'Scheduled maintenance date' })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({ example: '2026-08-24', description: 'Next scheduled service date' })
  @IsDateString()
  @IsOptional()
  nextServiceDate?: string;

  @ApiPropertyOptional({ example: 4250.5, description: 'Hour meter or odometer reading' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  odometerOrHourMeterReading?: number;

  @ApiPropertyOptional({ example: 'Urgent repair required for main quarry work.' })
  @IsString()
  @IsOptional()
  notes?: string;
}
