import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UsersService } from './users.service';
import { RolesService } from './roles.service';
import { UsersController, RolesController } from './users.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UsersController, RolesController],
  providers: [UsersService, RolesService],
})
export class UsersModule {}
