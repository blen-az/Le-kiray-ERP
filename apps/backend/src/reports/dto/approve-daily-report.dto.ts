import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveDailyReportDto {
  @ApiProperty({ example: 'Report reviewed and approved by Project Manager.', required: false })
  @IsString()
  @IsOptional()
  approvalNotes?: string;
}
