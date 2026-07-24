import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ApprovalAction {
  APPROVE = 'Approved',
  REJECT = 'Rejected',
}

export class ApproveExpenseDto {
  @ApiPropertyOptional({ description: 'Approval decision status', enum: ApprovalAction, default: ApprovalAction.APPROVE })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Approval or rejection review notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
