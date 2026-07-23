import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'ceo@abcconstruction.com', description: 'User login email address' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: 'password123', description: 'User secure password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;
}
