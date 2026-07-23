import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Abebe', description: 'Employee first name' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Kebede', description: 'Employee last name' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'abebe@example.com', description: 'Employee email address', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+251911223344', description: 'Employee mobile number', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'OPERATOR', description: 'Job position', enum: ['OPERATOR', 'LABORER', 'FOREMAN', 'SITE_MANAGER'] })
  @IsString()
  @IsNotEmpty()
  role!: string;

  @ApiProperty({ example: 'test-site-uuid', description: 'Assigned construction site location ID', required: false })
  @IsUUID()
  @IsOptional()
  siteId?: string;
}
