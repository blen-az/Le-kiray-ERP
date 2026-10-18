import { ApiPropertyOptional, PartialType, PickType } from '@nestjs/swagger';
import { IsIn, IsOptional, IsUrl, MaxLength } from 'class-validator';
import { CreateTenderDto } from './create-tender.dto';

export const NOTICE_STATUSES = ['Open', 'Cancelled'] as const;

/** Public facts about a tender; a company's own bid details (bid amount, win chance, manager) are never on a notice */
export class CreateTenderNoticeDto extends PickType(CreateTenderDto, [
  'tenderNumber',
  'title',
  'procuringEntity',
  'category',
  'procurementMethod',
  'source',
  'requiredGrade',
  'location',
  'regionOrCity',
  'description',
  'estimatedValue',
  'documentFee',
  'bidSecurityAmount',
  'bidSecurityType',
  'publishedDate',
  'siteVisitDate',
  'clarificationDeadline',
  'submissionDeadline',
  'openingDate',
] as const) {
  @ApiPropertyOptional({ example: 'https://egp.ppa.gov.et/tender/12345' })
  @IsUrl({ require_protocol: true }, { message: 'Source link must be a full web address starting with http(s)://' })
  @MaxLength(500)
  @IsOptional()
  sourceUrl?: string;
}

export class UpdateTenderNoticeDto extends PartialType(CreateTenderNoticeDto) {
  @ApiPropertyOptional({ example: 'Cancelled', enum: NOTICE_STATUSES })
  @IsIn(NOTICE_STATUSES as unknown as string[])
  @IsOptional()
  status?: string;
}
