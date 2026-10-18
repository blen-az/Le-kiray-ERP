import { Module } from '@nestjs/common';
import { TendersService } from './tenders.service';
import { TenderBoardService } from './tender-board.service';
import { TendersController } from './tenders.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TendersController],
  providers: [TendersService, TenderBoardService],
  exports: [TendersService, TenderBoardService],
})
export class TendersModule {}
