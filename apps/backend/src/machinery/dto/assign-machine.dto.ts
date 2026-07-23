import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID, IsDateString, IsString } from 'class-validator';

export class AssignMachineDto {
  @ApiProperty({ example: 'test-project-uuid', description: 'Destination project ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Project ID is required' })
  projectId!: string;

  @ApiProperty({ example: 'test-site-uuid', description: 'Destination site ID' })
  @IsUUID()
  @IsNotEmpty({ message: 'Site ID is required' })
  siteId!: string;

  @ApiProperty({ example: 'test-operator-uuid', description: 'Assigned operator employee ID', required: false })
  @IsUUID()
  @IsOptional()
  operatorId?: string;

  @ApiProperty({ example: '2026-07-23', description: 'Assignment launch date' })
  @IsDateString()
  @IsNotEmpty({ message: 'Start date is required' })
  startDate!: string;

  @ApiProperty({ example: '2026-12-31', description: 'Expected return date', required: false })
  @IsDateString()
  @IsOptional()
  expectedReturnDate?: string;

  @ApiProperty({ example: 'Standard grading work notes...', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
