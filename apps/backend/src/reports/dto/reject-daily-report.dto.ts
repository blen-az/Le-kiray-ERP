import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectDailyReportDto {
  @ApiProperty({ example: 'Missing concrete cube testing result documentation.' })
  @IsString()
  @IsNotEmpty()
  rejectionReason!: string;
}
