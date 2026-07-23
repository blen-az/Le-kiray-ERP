import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { SitesService } from './sites.service';
import { SitesController } from './sites.controller';

@Module({
  controllers: [ProjectsController, SitesController],
  providers: [ProjectsService, SitesService],
  exports: [ProjectsService, SitesService],
})
export class ProjectsModule {}
