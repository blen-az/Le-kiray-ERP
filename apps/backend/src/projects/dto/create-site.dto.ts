import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsNumber, IsUUID, IsDateString } from 'class-validator';

export class CreateSiteDto {
  @ApiProperty({ example: 'Bole Main Excavation Site', description: 'Name of the site compound' })
  @IsString()
  @IsNotEmpty({ message: 'Site name is required' })
  siteName!: string;

  @ApiProperty({ example: 'Bole Olympia, Addis Ababa', description: 'Physical address of the site' })
  @IsString()
  @IsNotEmpty({ message: 'Location is required' })
  location!: string;

  @ApiProperty({ example: 9.0123, description: 'GPS Latitude coordinate', required: false })
  @IsNumber()
  @IsOptional()
  gpsLatitude?: number;

  @ApiProperty({ example: 38.7456, description: 'GPS Longitude coordinate', required: false })
  @IsNumber()
  @IsOptional()
  gpsLongitude?: number;

  @ApiProperty({ example: 'test-manager-uuid', description: 'Site Manager user ID', required: false })
  @IsUUID()
  @IsOptional()
  siteManagerId?: string;

  @ApiProperty({ 
    example: 'Active', 
    description: 'Active site operational status', 
    enum: ['Active', 'Inactive', 'Delayed', 'Completed', 'Suspended'] 
  })
  @IsEnum(['Active', 'Inactive', 'Delayed', 'Completed', 'Suspended'], {
    message: 'Status must be one of: Active, Inactive, Delayed, Completed, Suspended'
  })
  @IsNotEmpty({ message: 'Status is required' })
  status!: string;

  @ApiProperty({ example: '2026-07-23', description: 'Site operations launch date', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ example: 'Contains auxiliary central warehouse stores', description: 'General site notes', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
