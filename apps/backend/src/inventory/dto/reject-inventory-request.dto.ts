import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RejectInventoryRequestDto {
  @ApiProperty({ description: 'Reason for rejecting the material request', example: 'Insufficient store budget or unapproved work scope' })
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is required' })
  rejectionReason: string;
}
