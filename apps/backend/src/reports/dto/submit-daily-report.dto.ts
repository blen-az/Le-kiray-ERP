import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsDateString, IsUUID, Min, IsArray } from 'class-validator';

export class SubmitDailyReportDto {
  @ApiProperty({ example: 'test-project-uuid', description: 'Associated project ID' })
  @IsUUID()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ example: 'test-site-uuid', description: 'Associated site location ID' })
  @IsUUID()
  @IsNotEmpty()
  siteId!: string;

  @ApiProperty({ example: '2026-07-23', description: 'Daily report date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ example: 'Excavated 150m trench line...', description: 'Detailed work description completed today' })
  @IsString()
  @IsNotEmpty()
  workCompleted!: string;

  @ApiProperty({ example: 'CAT Excavator active...', description: 'Machinery deployed on site today', required: false })
  @IsString()
  @IsOptional()
  machineryUsed?: string;

  @ApiProperty({ example: 18, description: 'Total workers present on site' })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  workersPresent!: number;

  @ApiProperty({ example: 'Cement: 25 bags...', description: 'Raw materials consumed on site', required: false })
  @IsString()
  @IsOptional()
  materialsUsed?: string;

  @ApiProperty({ example: 200.0, description: 'Litres of fuel used on site', required: false })
  @IsNumber()
  @Min(0)
  @IsOptional()
  fuelUsed?: number;

  @ApiProperty({ example: 'Rain delays...', description: 'Site blockers encountered', required: false })
  @IsString()
  @IsOptional()
  issuesBlockers?: string;

  @ApiProperty({ example: ['https://example.com/site-photos/trench.jpg'], description: 'Photos list', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  photos?: string[];
}
