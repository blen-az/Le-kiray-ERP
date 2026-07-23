import { Module } from '@nestjs/common';
import { MachineryService } from './machinery.service';
import { MachineryController } from './machinery.controller';

@Module({
  controllers: [MachineryController],
  providers: [MachineryService],
  exports: [MachineryService],
})
export class MachineryModule {}
