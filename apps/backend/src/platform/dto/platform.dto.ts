import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export const COMPANY_STATUSES = ['Active', 'Suspended'] as const;

class CompanyDetailsDto {
  @ApiPropertyOptional({ example: '0012345678', description: 'Taxpayer Identification Number' })
  @IsString()
  @MaxLength(30)
  @IsOptional()
  tinNumber?: string;

  @ApiPropertyOptional({ example: 'GC-1' })
  @IsString()
  @MaxLength(20)
  @IsOptional()
  licenseGrade?: string;

  @ApiPropertyOptional({ example: 'Addis Ababa' })
  @IsString()
  @MaxLength(80)
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '+251 911 234 567' })
  @IsString()
  @MaxLength(40)
  @IsOptional()
  phone?: string;
}

export class OnboardCompanyDto extends CompanyDetailsDto {
  @ApiProperty({ example: 'Sur Construction PLC' })
  @IsString()
  @IsNotEmpty({ message: 'Company name is required' })
  @MaxLength(120)
  companyName!: string;

  @ApiProperty({ example: 'Dawit' })
  @IsString()
  @IsNotEmpty({ message: 'Owner first name is required' })
  @MaxLength(80)
  ownerFirstName!: string;

  @ApiProperty({ example: 'Mekonnen' })
  @IsString()
  @IsNotEmpty({ message: 'Owner last name is required' })
  @MaxLength(80)
  ownerLastName!: string;

  @ApiProperty({ example: 'dawit@surconstruction.et' })
  @IsEmail({}, { message: 'Enter a valid owner email address' })
  @MaxLength(160)
  ownerEmail!: string;
}

export class UpdateCompanyDto extends CompanyDetailsDto {
  @ApiPropertyOptional({ example: 'Sur Construction PLC' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Suspended', enum: COMPANY_STATUSES })
  @IsIn(COMPANY_STATUSES as unknown as string[])
  @IsOptional()
  status?: string;
}

export class ResetOwnerPasswordDto {
  @ApiPropertyOptional({ description: 'Specific owner to reset; defaults to the first active owner' })
  @IsUUID()
  @IsOptional()
  userId?: string;
}
