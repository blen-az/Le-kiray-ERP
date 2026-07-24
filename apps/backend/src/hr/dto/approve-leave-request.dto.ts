import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveLeaveRequestDto {
  @ApiPropertyOptional({ example: 'Approved by HR Manager', description: 'Approval notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
