import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, IsUUID, IsDateString, IsEnum, IsString } from 'class-validator';

export class UpdateFuelRequestDto {
  @ApiProperty({ example: 'test-project-uuid', description: 'Target project ID', required: false })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiProperty({ example: 'test-site-uuid', description: 'Target site location ID', required: false })
  @IsUUID()
  @IsOptional()
  siteId?: string;

  @ApiProperty({ example: 'test-machine-uuid', description: 'Machine ID', required: false })
  @IsUUID()
  @IsOptional()
  machineId?: string;

  @ApiProperty({ example: 'test-operator-uuid', description: 'Operator ID', required: false })
  @IsUUID()
  @IsOptional()
  operatorId?: string;

  @ApiProperty({ example: 200, description: 'Liters requested', required: false })
  @IsNumber()
  @Min(0.01, { message: 'Liters requested must be greater than 0' })
  @IsOptional()
  litersRequested?: number;

  @ApiProperty({ example: '2026-07-23', description: 'Date of request', required: false })
  @IsDateString()
  @IsOptional()
  requestDate?: string;

  @ApiProperty({ example: 'Normal', enum: ['Low', 'Normal', 'High', 'Urgent'], required: false })
  @IsEnum(['Low', 'Normal', 'High', 'Urgent'], { message: 'Priority must be: Low, Normal, High, Urgent' })
  @IsOptional()
  priority?: string;

  @ApiProperty({ example: 'Daily operations', required: false })
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiProperty({ example: 'Updated notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
