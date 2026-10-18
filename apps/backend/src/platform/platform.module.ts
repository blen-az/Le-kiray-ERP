import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PlatformController } from './platform.controller';
import { PlatformService } from './platform.service';
import { PlatformAdminGuard } from './platform-admin.guard';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [PlatformController],
  providers: [PlatformService, PlatformAdminGuard],
})
export class PlatformModule {}
