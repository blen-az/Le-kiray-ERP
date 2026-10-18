import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export const TENDER_CATEGORIES = [
  'Road Construction',
  'Building Construction',
  'Bridge & Structures',
  'Water & Irrigation',
  'Earthworks',
  'Machinery Rental',
  'Supply',
  'Consultancy',
  'Other',
] as const;

export const TENDER_PROCUREMENT_METHODS = [
  'Open National Bidding',
  'Open International Bidding',
  'Restricted Bidding',
  'Request for Quotation',
  'Direct Procurement',
] as const;

export const TENDER_SOURCES = [
  'e-GP Portal',
  'Newspaper',
  'Direct Invitation',
  'Le’Kiray Marketplace',
  'Other',
] as const;

export const TENDER_BID_SECURITY_TYPES = ['Bank Guarantee', 'CPO', 'Insurance Bond', 'Cash'] as const;

/** Pipeline stages a tender can be moved between with tenders:update */
export const TENDER_PIPELINE_STATUSES = [
  'Identified',
  'Preparing',
  'Submitted',
  'Under Evaluation',
  'No Bid',
  'Cancelled',
] as const;

/** Final outcomes that require tenders:award */
export const TENDER_OUTCOME_STATUSES = ['Won', 'Lost'] as const;

/** Standard Ethiopian public-procurement bid documents, pre-loaded on every new tender */
export const DEFAULT_TENDER_CHECKLIST = [
  'Renewed trade licence',
  'Contractor grade / registration certificate',
  'VAT registration certificate',
  'Tax clearance certificate',
  'Supplier list registration (PPA / e-GP)',
  'Bid security',
  'Bid document purchase receipt',
  'Technical proposal & work methodology',
  'Priced Bill of Quantities (financial offer)',
  'Equipment list & ownership evidence',
  'Key personnel CVs',
  'Similar work experience letters',
];

export class CreateTenderDto {
  @ApiProperty({ example: 'ERA/NCB/W-014/2026', description: 'Reference number issued by the procuring entity' })
  @IsString()
  @IsNotEmpty({ message: 'Tender number is required' })
  @MaxLength(120)
  tenderNumber!: string;

  @ApiProperty({ example: 'Asphalt Upgrading of Modjo – Ziway Link Road (32 km)' })
  @IsString()
  @IsNotEmpty({ message: 'Tender title is required' })
  @MaxLength(300)
  title!: string;

  @ApiProperty({ example: 'Ethiopian Roads Administration' })
  @IsString()
  @IsNotEmpty({ message: 'Procuring entity is required' })
  @MaxLength(200)
  procuringEntity!: string;

  @ApiProperty({ example: 'Road Construction', enum: TENDER_CATEGORIES })
  @IsIn(TENDER_CATEGORIES as unknown as string[], { message: 'Invalid tender category' })
  category!: string;

  @ApiPropertyOptional({ example: 'Open National Bidding', enum: TENDER_PROCUREMENT_METHODS })
  @IsIn(TENDER_PROCUREMENT_METHODS as unknown as string[], { message: 'Invalid procurement method' })
  @IsOptional()
  procurementMethod?: string;

  @ApiPropertyOptional({ example: 'e-GP Portal', enum: TENDER_SOURCES })
  @IsIn(TENDER_SOURCES as unknown as string[], { message: 'Invalid tender source' })
  @IsOptional()
  source?: string;

  @ApiPropertyOptional({ example: 'GC-1', description: 'Minimum contractor licence grade' })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  requiredGrade?: string;

  @ApiPropertyOptional({ example: 'Modjo – Ziway corridor' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({ example: 'Oromia' })
  @IsString()
  @IsOptional()
  regionOrCity?: string;

  @ApiPropertyOptional({ example: 'DBST to asphalt concrete upgrade including 4 box culverts.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 60, description: 'Estimated chance of winning (0-100)' })
  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  winProbability?: number;

  @ApiPropertyOptional({ example: 185000000, description: 'Engineer estimate / client budget in ETB' })
  @IsNumber()
  @Min(0, { message: 'Estimated value cannot be negative' })
  @IsOptional()
  estimatedValue?: number;

  @ApiPropertyOptional({ example: 172500000, description: 'Our bid price in ETB' })
  @IsNumber()
  @Min(0, { message: 'Bid amount cannot be negative' })
  @IsOptional()
  bidAmount?: number;

  @ApiPropertyOptional({ example: 500 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  documentFee?: number;

  @ApiPropertyOptional({ example: 2000000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  bidSecurityAmount?: number;

  @ApiPropertyOptional({ example: 'CPO', enum: TENDER_BID_SECURITY_TYPES })
  @IsIn(TENDER_BID_SECURITY_TYPES as unknown as string[], { message: 'Invalid bid security type' })
  @IsOptional()
  bidSecurityType?: string;

  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsDateString()
  @IsOptional()
  publishedDate?: string;

  @ApiPropertyOptional({ example: '2026-10-15T09:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  siteVisitDate?: string;

  @ApiPropertyOptional({ example: '2026-10-20T17:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  clarificationDeadline?: string;

  @ApiProperty({ example: '2026-11-02T10:00:00.000Z', description: 'Bid submission deadline' })
  @IsDateString()
  @IsNotEmpty({ message: 'Submission deadline is required' })
  submissionDeadline!: string;

  @ApiPropertyOptional({ example: '2026-11-02T10:30:00.000Z' })
  @IsDateString()
  @IsOptional()
  openingDate?: string;

  @ApiPropertyOptional({ example: 'user-uuid', description: 'User responsible for preparing the bid' })
  @IsUUID()
  @IsOptional()
  bidManagerId?: string;

  @ApiPropertyOptional({
    description: 'Custom bid-document checklist. Defaults to the standard Ethiopian public procurement list.',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @IsOptional()
  checklist?: string[];
}
