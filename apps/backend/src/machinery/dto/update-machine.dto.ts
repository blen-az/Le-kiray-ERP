import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsNumber, Min, IsDateString, IsUUID } from 'class-validator';

export class UpdateMachineDto {
  @ApiProperty({ example: 'Excavator', description: 'Type of heavy machinery', required: false })
  @IsString()
  @IsOptional()
  machineType?: string;

  @ApiProperty({ example: 'CAT', description: 'Manufacturer brand', required: false })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({ example: '320D', description: 'Model code', required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ example: 'ET-3-A1234', description: 'License plate number', required: false })
  @IsString()
  @IsOptional()
  plateNumber?: string;

  @ApiProperty({ example: 'SN-CAT320D-9988', description: 'Serial number', required: false })
  @IsString()
  @IsOptional()
  serialNumber?: string;

  @ApiProperty({ example: '20 Tons', description: 'Operational load capacity', required: false })
  @IsString()
  @IsOptional()
  capacity?: string;

  @ApiProperty({ 
    example: 'Owned', 
    description: 'Ownership/Leasing type', 
    enum: ['Owned', 'Rented from Le’Kiray Marketplace', 'Rented Externally'],
    required: false
  })
  @IsEnum(['Owned', 'Rented from Le’Kiray Marketplace', 'Rented Externally'], {
    message: 'Ownership type must be: Owned, Rented from Le’Kiray Marketplace, Rented Externally'
  })
  @IsOptional()
  ownershipType?: string;

  @ApiProperty({ 
    example: 'Internal Fleet', 
    description: 'Origin source of machine', 
    enum: ['Internal Fleet', 'Le’Kiray Marketplace', 'External Rental Provider'],
    required: false
  })
  @IsEnum(['Internal Fleet', 'Le’Kiray Marketplace', 'External Rental Provider'], {
    message: 'Source must be: Internal Fleet, Le’Kiray Marketplace, External Rental Provider'
  })
  @IsOptional()
  source?: string;

  @ApiProperty({ 
    example: 'Available', 
    description: 'Current fleet availability status', 
    enum: ['Available', 'Assigned', 'Active', 'Idle', 'Under Maintenance', 'Returned', 'Out of Service'],
    required: false
  })
  @IsEnum(['Available', 'Assigned', 'Active', 'Idle', 'Under Maintenance', 'Returned', 'Out of Service'], {
    message: 'Current status must be: Available, Assigned, Active, Idle, Under Maintenance, Returned, Out of Service'
  })
  @IsOptional()
  currentStatus?: string;

  @ApiProperty({ example: 'project-uuid', description: 'Current Project workspace ID', required: false })
  @IsUUID()
  @IsOptional()
  currentProjectId?: string;

  @ApiProperty({ example: 'site-uuid', description: 'Current Site location ID', required: false })
  @IsUUID()
  @IsOptional()
  currentSiteId?: string;

  @ApiProperty({ example: 'employee-operator-uuid', description: 'Current Operator employee ID', required: false })
  @IsUUID()
  @IsOptional()
  currentOperatorId?: string;

  @ApiProperty({ example: '2026-01-10', description: 'Rental agreement start date', required: false })
  @IsDateString()
  @IsOptional()
  rentalStartDate?: string;

  @ApiProperty({ example: '2026-12-31', description: 'Rental agreement end date', required: false })
  @IsDateString()
  @IsOptional()
  rentalEndDate?: string;

  @ApiProperty({ example: 3500.0, description: 'Daily rental cost in ETB', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Daily rental cost cannot be negative' })
  dailyRentalCost?: number;

  @ApiProperty({ example: 450.0, description: 'Hourly rental cost in ETB', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'Hourly rental cost cannot be negative' })
  hourlyRentalCost?: number;

  @ApiProperty({ example: 'Detailed machinery notes...', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
