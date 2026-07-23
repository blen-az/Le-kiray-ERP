import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, IsDateString, IsString, IsOptional } from 'class-validator';

export class IssueFuelRequestDto {
  @ApiProperty({ example: 200, description: 'Liters of diesel issued' })
  @IsNumber()
  @Min(0.01, { message: 'Liters issued must be greater than 0' })
  @IsNotEmpty({ message: 'Liters issued is required' })
  litersIssued!: number;

  @ApiProperty({ example: '2026-07-23', description: 'Usage/Dispense date' })
  @IsDateString()
  @IsNotEmpty({ message: 'Usage date is required' })
  usageDate!: string;

  @ApiProperty({ example: 8.5, description: 'Working hours logged', required: false })
  @IsNumber()
  @Min(0, { message: 'Working hours cannot be negative' })
  @IsOptional()
  workingHours?: number;

  @ApiProperty({ example: 4820.5, description: 'Hour meter or odometer reading', required: false })
  @IsNumber()
  @Min(0, { message: 'Reading cannot be negative' })
  @IsOptional()
  odometerOrHourMeterReading?: number;

  @ApiProperty({ example: 'http://bucket.com/receipts/fuel123.jpg', required: false })
  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @ApiProperty({ example: 'Dispensed from Bole Central Tank', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
