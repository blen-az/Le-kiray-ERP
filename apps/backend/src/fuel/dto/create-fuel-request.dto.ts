import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, IsUUID, IsDateString, IsEnum, IsString, IsOptional } from 'class-validator';

export class CreateFuelRequestDto {
  @ApiProperty({ example: 'test-project-uuid', description: 'Target project ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId!: string;

  @ApiProperty({ example: 'test-site-uuid', description: 'Target site location ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Site ID is required' })
  siteId!: string;

  @ApiProperty({ example: 'test-machine-uuid', description: 'Machine requiring fuel' })
  @IsUUID()
  @IsNotEmpty({ message: 'Machine ID is required' })
  machineId!: string;

  @ApiProperty({ example: 'test-operator-uuid', description: 'Assigned operator ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Operator ID is required' })
  operatorId!: string;

  @ApiProperty({ example: 200, description: 'Liters of diesel requested' })
  @IsNumber()
  @Min(0.01, { message: 'Liters requested must be greater than 0' })
  @IsNotEmpty({ message: 'Liters requested is required' })
  litersRequested!: number;

  @ApiProperty({ example: '2026-07-23', description: 'Date of the request' })
  @IsDateString()
  @IsNotEmpty({ message: 'Request date is required' })
  requestDate!: string;

  @ApiProperty({ example: 'Normal', enum: ['Low', 'Normal', 'High', 'Urgent'] })
  @IsEnum(['Low', 'Normal', 'High', 'Urgent'], { message: 'Priority must be: Low, Normal, High, Urgent' })
  @IsNotEmpty({ message: 'Priority is required' })
  priority!: string;

  @ApiProperty({ example: 'Daily excavation work', required: false })
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiProperty({ example: 'Machine is at 10% tank', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
