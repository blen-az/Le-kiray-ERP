import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateAttendanceDto {
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

  @ApiProperty({ example: '2025-01-20', description: 'Attendance Date' })
  @IsNotEmpty({ message: 'Attendance date is required' })
  @IsDateString()
  attendanceDate: string;

  @ApiProperty({ example: 'Present', description: 'Status: Present, Absent, Late, On Leave, Half Day, Sick, Permission, Holiday' })
  @IsNotEmpty({ message: 'Status is required' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: '2025-01-20T08:00:00.000Z', description: 'Check-in time' })
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @ApiPropertyOptional({ example: '2025-01-20T17:00:00.000Z', description: 'Check-out time' })
  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  @ApiPropertyOptional({ example: 8.0, description: 'Regular hours' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Regular hours cannot be negative' })
  regularHours?: number;

  @ApiPropertyOptional({ example: 2.0, description: 'Overtime hours' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Overtime hours cannot be negative' })
  overtimeHours?: number;

  @ApiPropertyOptional({ example: 'Completed earthwork section 2 overtime', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
