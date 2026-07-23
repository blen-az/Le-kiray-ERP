import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsDateString, IsString, IsEnum, IsNumber, Min } from 'class-validator';

export class UpdateAssignmentDto {
  @ApiProperty({ example: 'test-operator-uuid', description: 'Modify operator ID', required: false })
  @IsUUID()
  @IsOptional()
  operatorId?: string;

  @ApiProperty({ example: '2026-07-23', description: 'Modify start date', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: '2026-08-31', description: 'Modify end date', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ example: '2026-12-31', description: 'Expected return date', required: false })
  @IsDateString()
  @IsOptional()
  expectedReturnDate?: string;

  @ApiProperty({ example: '2026-07-25', description: 'Actual return date', required: false })
  @IsDateString()
  @IsOptional()
  actualReturnDate?: string;

  @ApiProperty({ 
    example: 'Returned', 
    description: 'Assignment lifecycle status', 
    enum: ['Assigned', 'Active', 'Completed', 'Returned', 'Cancelled'],
    required: false
  })
  @IsEnum(['Assigned', 'Active', 'Completed', 'Returned', 'Cancelled'], {
    message: 'Status must be one of: Assigned, Active, Completed, Returned, Cancelled'
  })
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 45.5, description: 'Log working hours', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Working hours cannot be negative' })
  workingHours?: number;

  @ApiProperty({ example: 12.0, description: 'Log idle hours', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Idle hours cannot be negative' })
  idleHours?: number;

  @ApiProperty({ example: 'Update details...', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
