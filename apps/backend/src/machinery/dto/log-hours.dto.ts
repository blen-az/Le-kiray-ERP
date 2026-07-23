import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, IsUUID } from 'class-validator';

export class LogWorkingHoursDto {
  @ApiProperty({ example: 'test-assignment-uuid', description: 'Active machine assignment ID' })
  @IsUUID()
  @IsNotEmpty()
  assignmentId!: string;

  @ApiProperty({ example: 8.5, description: 'Incremental working hours to log' })
  @IsNumber()
  @Min(0.1)
  @IsNotEmpty()
  hours!: number;
}
