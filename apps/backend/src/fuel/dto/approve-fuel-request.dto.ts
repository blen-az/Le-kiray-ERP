import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, IsString, IsOptional } from 'class-validator';

export class ApproveFuelRequestDto {
  @ApiProperty({ example: 200, description: 'Liters approved' })
  @IsNumber()
  @Min(0.01, { message: 'Liters approved must be greater than 0' })
  @IsNotEmpty({ message: 'Liters approved is required' })
  litersApproved!: number;

  @ApiProperty({ example: 110.50, description: 'ETB cost per liter' })
  @IsNumber()
  @Min(0, { message: 'Cost per liter cannot be negative' })
  @IsNotEmpty({ message: 'Cost per liter is required' })
  costPerLiter!: number;

  @ApiProperty({ example: 'Approved for Bole road grading', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
