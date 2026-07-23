import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min, Max, IsDateString, IsUUID } from 'class-validator';

export class UpdateProjectDto {
  @ApiProperty({ example: 'Bole Road Expansion', description: 'Name of the construction project', required: false })
  @IsString()
  @IsOptional()
  projectName?: string;

  @ApiProperty({ example: 'PRJ-BOLE-001', description: 'Unique internal code for project tracking', required: false })
  @IsString()
  @IsOptional()
  projectCode?: string;

  @ApiProperty({ example: 'Addis Ababa City Administration', description: 'Name of the client entity', required: false })
  @IsString()
  @IsOptional()
  clientName?: string;

  @ApiProperty({ example: 'Bole, Addis Ababa', description: 'General project location', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'Addis Ababa', description: 'State, region, or city division', required: false })
  @IsString()
  @IsOptional()
  regionOrCity?: string;

  @ApiProperty({ 
    example: 'Active', 
    description: 'Active project lifecycle status', 
    enum: ['Planning', 'Active', 'On Track', 'At Risk', 'Delayed', 'Completed', 'Suspended', 'Cancelled'],
    required: false
  })
  @IsEnum(['Planning', 'Active', 'On Track', 'At Risk', 'Delayed', 'Completed', 'Suspended', 'Cancelled'], {
    message: 'Status must be one of: Planning, Active, On Track, At Risk, Delayed, Completed, Suspended, Cancelled'
  })
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 45, description: 'Percentage completion progress (0 - 100)', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Progress cannot be negative' })
  @Max(100, { message: 'Progress cannot exceed 100' })
  progressPercentage?: number;

  @ApiProperty({ example: 45000000.0, description: 'Total allocated budget in ETB', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Budget cannot be negative' })
  budget?: number;

  @ApiProperty({ example: '2026-01-10', description: 'Contract start date', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2026-12-31', description: 'Contract end date', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: 'test-manager-uuid', description: 'Project Manager user ID', required: false })
  @IsUUID()
  @IsOptional()
  projectManagerId?: string;

  @ApiProperty({ example: 'Road widening construction details...', description: 'Project description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
