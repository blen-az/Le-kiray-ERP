import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Mulugeta' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ example: 'Assefa' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  @MaxLength(80)
  lastName!: string;

  @ApiProperty({ example: 'mulugeta@company.et' })
  @IsEmail({}, { message: 'Enter a valid email address' })
  @MaxLength(160)
  email!: string;

  @ApiProperty({ type: [String], description: 'Role IDs to assign' })
  @IsArray()
  @ArrayMinSize(1, { message: 'Assign at least one role' })
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  roleIds!: string[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Mulugeta' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Assefa' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Assign at least one role' })
  @ArrayMaxSize(10)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  @IsOptional()
  roleIds?: string[];

  @ApiPropertyOptional({ example: false, description: 'Deactivated users cannot sign in' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class CreateRoleDto {
  @ApiProperty({ example: 'Quantity Surveyor' })
  @IsString()
  @IsNotEmpty({ message: 'Role name is required' })
  @MaxLength(60)
  name!: string;

  @ApiPropertyOptional({ example: 'Prepares BoQs and tender pricing' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [String], example: ['dashboard:view', 'tenders:view', 'tenders:update'] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissions!: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ example: 'Quantity Surveyor' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Prepares BoQs and tender pricing' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];
}
