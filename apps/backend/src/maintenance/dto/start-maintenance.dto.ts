import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';

export class StartMaintenanceDto {
  @ApiPropertyOptional({ example: 'employee-uuid', description: 'Assigned mechanic employee ID' })
  @IsUUID()
  @IsOptional()
  assignedMechanicId?: string;

  @ApiPropertyOptional({ example: '2026-07-24T09:00:00.000Z', description: 'Actual work start timestamp' })
  @IsDateString()
  @IsOptional()
  startedAt?: string;

  @ApiPropertyOptional({ example: 'Mechanic initiated hydraulic seal repair.', description: 'Initial start notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
