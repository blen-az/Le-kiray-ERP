import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { TENDER_OUTCOME_STATUSES, TENDER_PIPELINE_STATUSES } from './create-tender.dto';

export class ChangeTenderStatusDto {
  @ApiProperty({ example: 'Submitted', enum: TENDER_PIPELINE_STATUSES })
  @IsIn(TENDER_PIPELINE_STATUSES as unknown as string[], {
    message: `Status must be one of: ${TENDER_PIPELINE_STATUSES.join(', ')}. Use the award endpoint for Won/Lost.`,
  })
  status!: string;

  @ApiPropertyOptional({ example: 'Below our minimum grade requirement.' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RecordTenderOutcomeDto {
  @ApiProperty({ example: 'Won', enum: TENDER_OUTCOME_STATUSES })
  @IsIn(TENDER_OUTCOME_STATUSES as unknown as string[], { message: 'Outcome must be Won or Lost' })
  outcome!: string;

  @ApiPropertyOptional({ example: 'Sur Construction PLC', description: 'Winning bidder (when lost)' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  awardedTo?: string;

  @ApiPropertyOptional({ example: 171900000, description: 'Contract award amount in ETB' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  awardedAmount?: number;

  @ApiPropertyOptional({ example: 'Lost on price by 0.3%. Competitor had own asphalt plant nearby.' })
  @IsString()
  @IsOptional()
  outcomeNotes?: string;
}

export class ConvertTenderToProjectDto {
  @ApiPropertyOptional({ example: 'PRJ-MZ-2026', description: 'Defaults to the tender number' })
  @IsString()
  @IsOptional()
  projectCode?: string;

  @ApiPropertyOptional({ example: '2026-12-01' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2028-06-30' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 'user-uuid', description: 'Defaults to the tender bid manager' })
  @IsUUID()
  @IsOptional()
  projectManagerId?: string;
}

export class CreateTenderChecklistItemDto {
  @ApiProperty({ example: 'Joint venture agreement' })
  @IsString()
  @IsNotEmpty({ message: 'Checklist label is required' })
  @MaxLength(200)
  label!: string;
}

export class UpdateTenderChecklistItemDto {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isDone?: boolean;

  @ApiPropertyOptional({ example: 'Joint venture agreement (notarised)' })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(200)
  label?: string;
}
