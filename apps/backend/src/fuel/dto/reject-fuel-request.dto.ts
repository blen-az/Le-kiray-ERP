import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectFuelRequestDto {
  @ApiProperty({ example: 'Incorrect machine selected', description: 'Reason for rejection' })
  @IsString()
  @IsNotEmpty({ message: 'Rejection reason is required' })
  rejectionReason!: string;
}
