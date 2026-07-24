import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateEmployeeAssignmentDto {
  @ApiProperty({ example: 'emp-uuid-1', description: 'Employee ID' })
  @IsNotEmpty({ message: 'Employee ID is required' })
  @IsString()
  employeeId: string;

  @ApiProperty({ example: 'proj-uuid-1', description: 'Project ID' })
  @IsNotEmpty({ message: 'Project ID is required' })
  @IsString()
  projectId: string;

  @ApiProperty({ example: 'site-uuid-1', description: 'Site ID' })
  @IsNotEmpty({ message: 'Site ID is required' })
  @IsString()
  siteId: string;

  @ApiPropertyOptional({ example: 'Senior Machine Operator', description: 'Position on site' })
  @IsOptional()
  @IsString()
  positionOnSite?: string;

  @ApiProperty({ example: '2025-01-15', description: 'Assignment start date' })
  @IsNotEmpty({ message: 'Start date is required' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2025-06-30', description: 'Assignment end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Active', description: 'Status: Active, Completed, Transferred, Cancelled' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Assigned to excavation section 3', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
