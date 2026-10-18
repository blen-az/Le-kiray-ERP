import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export const PASSWORD_RULE_MESSAGE = 'Password must be at least 10 characters and include a letter and a number';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Current (or temporary) password' })
  @IsString()
  @IsNotEmpty()
  currentPassword!: string;

  @ApiProperty({ example: 'Kiray-2026-site!', description: PASSWORD_RULE_MESSAGE })
  @IsString()
  @MinLength(10, { message: PASSWORD_RULE_MESSAGE })
  @MaxLength(72, { message: 'Password must be at most 72 characters' })
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: PASSWORD_RULE_MESSAGE })
  newPassword!: string;
}
