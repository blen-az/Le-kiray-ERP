import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, IsOptional, IsString, IsUUID } from 'class-validator';

export class IssueInventoryRequestDto {
  @ApiProperty({ description: 'Quantity issued (must be > 0)', example: 100 })
  @IsNumber()
  @Min(0.0001, { message: 'Quantity issued must be greater than 0' })
  quantityIssued: number;

  @ApiPropertyOptional({ description: 'Source warehouse ID from which material is issued' })
  @IsUUID()
  @IsOptional()
  sourceWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Notes or waybill reference for issuance' })
  @IsString()
  @IsOptional()
  notes?: string;
}
