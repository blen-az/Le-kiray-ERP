import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, IsOptional, IsString } from 'class-validator';

export class ApproveInventoryRequestDto {
  @ApiProperty({ description: 'Approved quantity (must be > 0)', example: 100 })
  @IsNumber()
  @Min(0.0001, { message: 'Quantity approved must be greater than 0' })
  quantityApproved: number;

  @ApiPropertyOptional({ description: 'Approval notes or condition remarks' })
  @IsString()
  @IsOptional()
  notes?: string;
}
