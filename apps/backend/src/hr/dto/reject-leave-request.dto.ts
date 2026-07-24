import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectLeaveRequestDto {
  @ApiProperty({ example: 'Critical site milestone deadline during requested dates', description: 'Rejection reason' })
  @IsNotEmpty({ message: 'Rejection reason is required' })
  @IsString()
  rejectionReason: string;
}
