import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class RecordAttendanceDto {
  @ApiProperty({ example: 'test-employee-uuid', description: 'Target employee ID' })
  @IsUUID()
  @IsNotEmpty()
  employeeId!: string;

  @ApiProperty({ example: '2026-07-23', description: 'Attendance tracking date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  date!: string;

  @ApiProperty({ example: 'PRESENT', description: 'Daily attendance status', enum: ['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE'] })
  @IsEnum(['PRESENT', 'ABSENT', 'LATE', 'ON_LEAVE'])
  @IsNotEmpty()
  status!: 'PRESENT' | 'ABSENT' | 'LATE' | 'ON_LEAVE';

  @ApiProperty({ example: 'Sick leave approved', description: 'Remarks or notes', required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}
