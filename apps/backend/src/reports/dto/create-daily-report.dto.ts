import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsUUID,
  Min,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DailyReportMachineryItemDto {
  @ApiProperty({ example: 'machine-uuid' })
  @IsUUID()
  @IsNotEmpty()
  machineId!: string;

  @ApiProperty({ example: 'operator-employee-uuid', required: false })
  @IsUUID()
  @IsOptional()
  operatorId?: string;

  @ApiProperty({ example: 8.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  workingHours?: number;

  @ApiProperty({ example: 1.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  idleHours?: number;

  @ApiProperty({ example: 120.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  fuelUsedLiters?: number;

  @ApiProperty({ example: 'Trenching loop', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class DailyReportMaterialItemDto {
  @ApiProperty({ example: 'inventory-item-uuid' })
  @IsUUID()
  @IsNotEmpty()
  inventoryItemId!: string;

  @ApiProperty({ example: 50.0 })
  @IsNumber()
  @Min(0.01)
  quantityUsed!: number;

  @ApiProperty({ example: 'Bag', required: false })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiProperty({ example: 42500.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedCost?: number;

  @ApiProperty({ example: 'Retaining wall pouring', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class DailyReportWorkerItemDto {
  @ApiProperty({ example: 'employee-uuid' })
  @IsUUID()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ example: 'Present', required: false })
  @IsString()
  @IsOptional()
  attendanceStatus?: string;

  @ApiProperty({ example: 8.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  regularHours?: number;

  @ApiProperty({ example: 2.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  overtimeHours?: number;

  @ApiProperty({ example: 'Concrete team lead', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateDailyReportDto {
  @ApiProperty({ example: 'project-uuid', description: 'Associated project ID' })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ example: 'site-uuid', description: 'Associated site location ID' })
  @IsUUID()
  @IsNotEmpty()
  siteId!: string;

  @ApiProperty({ example: '2026-07-24', description: 'Daily report date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  reportDate!: string;

  @ApiProperty({ example: 'Sunny', description: 'Weather condition on site', required: false })
  @IsString()
  @IsOptional()
  weatherCondition?: string;

  @ApiProperty({ example: 'Excavated 150m trench line and cast foundation footings.' })
  @IsString()
  @IsNotEmpty()
  workCompleted!: string;

  @ApiProperty({ example: 'Continue retaining wall rebar binding and concrete pour.', required: false })
  @IsString()
  @IsOptional()
  workPlannedTomorrow?: string;

  @ApiProperty({ example: 'Shortage of 16mm rebar delayed slab work.', required: false })
  @IsString()
  @IsOptional()
  issuesOrBlockers?: string;

  @ApiProperty({ example: 'No safety incidents reported today.', required: false })
  @IsString()
  @IsOptional()
  safetyIncidents?: string;

  @ApiProperty({ example: 'All concrete cube samples met 30MPa strength spec.', required: false })
  @IsString()
  @IsOptional()
  qualityIssues?: string;

  @ApiProperty({ example: 'Site team worked smoothly.', required: false })
  @IsString()
  @IsOptional()
  generalNotes?: string;

  @ApiProperty({ example: 12, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  workersPresent?: number;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  workersAbsent?: number;

  @ApiProperty({ example: 96.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalRegularHours?: number;

  @ApiProperty({ example: 14.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalOvertimeHours?: number;

  @ApiProperty({ example: 3, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  machineryUsedCount?: number;

  @ApiProperty({ example: 350.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  fuelUsedLiters?: number;

  @ApiProperty({ example: 125000.0, required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  materialsUsedValue?: number;

  @ApiProperty({ example: ['https://storage.lekiray.et/site-1/photo-1.jpg'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];

  @ApiProperty({ example: ['https://storage.lekiray.et/site-1/concrete-test.pdf'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  documents?: string[];

  @ApiProperty({ example: 'Submitted', description: 'Initial status ("Draft" or "Submitted")', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ type: [DailyReportMachineryItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyReportMachineryItemDto)
  @IsOptional()
  machineryRecords?: DailyReportMachineryItemDto[];

  @ApiProperty({ type: [DailyReportMaterialItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyReportMaterialItemDto)
  @IsOptional()
  materialRecords?: DailyReportMaterialItemDto[];

  @ApiProperty({ type: [DailyReportWorkerItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailyReportWorkerItemDto)
  @IsOptional()
  workerRecords?: DailyReportWorkerItemDto[];
}
