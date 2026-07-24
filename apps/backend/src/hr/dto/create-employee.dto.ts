import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsNumber,
  Min,
  IsDateString,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiPropertyOptional({ example: 'EMP-001', description: 'Internal employee code' })
  @IsOptional()
  @IsString()
  employeeCode?: string;

  @ApiProperty({ example: 'Abebe', description: 'First name' })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ example: 'Bekele', description: 'Middle name' })
  @IsOptional()
  @IsString()
  middleName?: string;

  @ApiProperty({ example: 'Tadesse', description: 'Last name' })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: '+251911223344', description: 'Phone number' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'abebe@lekiray.et', description: 'Email address' })
  @IsOptional()
  @IsEmail({}, { message: 'Email must be valid if provided' })
  email?: string;

  @ApiPropertyOptional({ example: 'Male', description: 'Gender' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiPropertyOptional({ example: '1990-05-15', description: 'Date of birth' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'FIN-12345678', description: 'National ID number' })
  @IsOptional()
  @IsString()
  nationalIdNumber?: string;

  @ApiProperty({ example: 'Machine Operator', description: 'Job position' })
  @IsNotEmpty({ message: 'Position is required' })
  @IsString()
  position: string;

  @ApiPropertyOptional({ example: 'Fleet Operations', description: 'Department' })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ example: 'Permanent', description: 'Employment Type' })
  @IsNotEmpty({ message: 'Employment type is required' })
  @IsString()
  employmentType: string;

  @ApiProperty({ example: 'Active', description: 'Employment Status' })
  @IsNotEmpty({ message: 'Employment status is required' })
  @IsString()
  employmentStatus: string;

  @ApiProperty({ example: '2023-01-10', description: 'Hire date' })
  @IsNotEmpty({ message: 'Hire date is required' })
  @IsDateString()
  hireDate: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Termination date' })
  @IsOptional()
  @IsDateString()
  terminationDate?: string;

  @ApiPropertyOptional({ example: 450.0, description: 'Daily rate (ETB)' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Daily rate cannot be negative' })
  dailyRate?: number;

  @ApiPropertyOptional({ example: 12000.0, description: 'Monthly salary (ETB)' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Monthly salary cannot be negative' })
  monthlySalary?: number;

  @ApiPropertyOptional({ example: 'Kebede Tadesse', description: 'Emergency contact name' })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '+251911998877', description: 'Emergency contact phone' })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ example: 'Bole Subcity, Woreda 03, Addis Ababa', description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'https://docs.lekiray.et/contracts/emp-001.pdf', description: 'Document URL' })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ example: 'Certified CAT Excavator Operator', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'site-uuid-1', description: 'Optional initial site ID' })
  @IsOptional()
  @IsString()
  siteId?: string;
}
