import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';

export class CreateLeaveRequestDto {
  @ApiProperty({ example: 'emp-uuid-1', description: 'Employee ID' })
  @IsNotEmpty({ message: 'Employee ID is required' })
  @IsString()
  employeeId: string;

  @ApiProperty({ example: 'Annual Leave', description: 'Leave Type: Annual Leave, Sick Leave, Emergency Leave, Maternity Leave, Paternity Leave, Unpaid Leave, Permission, Other' })
  @IsNotEmpty({ message: 'Leave type is required' })
  @IsString()
  leaveType: string;

  @ApiProperty({ example: '2025-02-01', description: 'Start Date' })
  @IsNotEmpty({ message: 'Start date is required' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2025-02-05', description: 'End Date' })
  @IsNotEmpty({ message: 'End date is required' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 5, description: 'Total Days' })
  @IsOptional()
  @IsNumber()
  @Min(0.5, { message: 'Total days must be at least 0.5' })
  totalDays?: number;

  @ApiProperty({ example: 'Family event and personal vacation', description: 'Reason for leave' })
  @IsNotEmpty({ message: 'Reason is required' })
  @IsString()
  reason: string;
}
