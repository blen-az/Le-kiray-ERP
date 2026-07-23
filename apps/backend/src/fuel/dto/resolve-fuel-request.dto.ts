import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsNumber, Min, IsOptional } from 'class-validator';

export class ResolveFuelRequestDto {
  @ApiProperty({ example: 'ISSUED', description: 'Resolution status', enum: ['APPROVED', 'REJECTED', 'ISSUED'] })
  @IsEnum(['APPROVED', 'REJECTED', 'ISSUED'])
  @IsNotEmpty()
  status!: 'APPROVED' | 'REJECTED' | 'ISSUED';

  @ApiProperty({ example: 110.50, description: 'Fuel cost rate in ETB per liter', required: false })
  @IsNumber()
  @Min(1)
  @IsOptional()
  costPerLiter?: number;
}
