import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelMaintenanceDto {
  @ApiPropertyOptional({ example: 'Machine issue was resolved without mechanical intervention.' })
  @IsString()
  @IsOptional()
  reason?: string;
}
