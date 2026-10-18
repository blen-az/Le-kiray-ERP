import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateTenderDto } from './create-tender.dto';

export class UpdateTenderDto extends PartialType(OmitType(CreateTenderDto, ['checklist'] as const)) {
  @ApiPropertyOptional({ example: true, description: 'Bid security has been returned by the procuring entity' })
  @IsBoolean()
  @IsOptional()
  bidSecurityReturned?: boolean;
}
