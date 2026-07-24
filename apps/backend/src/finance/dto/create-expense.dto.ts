import {
  IsString,
  IsNumber,
  IsOptional,
  IsDateString,
  Min,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ExpenseCategory {
  FUEL = 'Fuel',
  INVENTORY_MATERIALS = 'Inventory / Materials',
  MACHINERY_RENTAL = 'Machinery Rental',
  MAINTENANCE = 'Maintenance',
  LABOR = 'Labor',
  TRANSPORT = 'Transport',
  SUBCONTRACTOR = 'Subcontractor',
  TOOLS_EQUIPMENT = 'Tools and Equipment',
  SITE_OFFICE = 'Site Office',
  UTILITIES = 'Utilities',
  PERMIT_GOVERNMENT_FEE = 'Permit / Government Fee',
  MISCELLANEOUS = 'Miscellaneous',
  OTHER = 'Other',
}

export enum ExpenseStatus {
  DRAFT = 'Draft',
  RECORDED = 'Recorded',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}

export class CreateExpenseDto {
  @ApiPropertyOptional({ description: 'Target project ID' })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Target site ID' })
  @IsOptional()
  @IsString()
  siteId?: string;

  @ApiPropertyOptional({ description: 'Target heavy machine ID' })
  @IsOptional()
  @IsString()
  machineId?: string;

  @ApiProperty({ description: 'Expense category', enum: ExpenseCategory })
  @IsString()
  expenseCategory: string;

  @ApiPropertyOptional({ description: 'Expense type classification (Operational, Direct, Overhead, etc.)' })
  @IsOptional()
  @IsString()
  expenseType?: string;

  @ApiProperty({ description: 'Expense amount in ETB', example: 15000.0 })
  @IsNumber()
  @Min(0.01, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'ETB' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Date expense was incurred', example: '2026-07-24' })
  @IsDateString()
  expenseDate: string;

  @ApiPropertyOptional({ description: 'Description of operational expense' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Vendor or supplier name' })
  @IsOptional()
  @IsString()
  vendorName?: string;

  @ApiPropertyOptional({ description: 'URL or path to uploaded receipt document' })
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiPropertyOptional({ description: 'Reference number, invoice number, or receipt number' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Status', enum: ExpenseStatus, default: ExpenseStatus.RECORDED })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
