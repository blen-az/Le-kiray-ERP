import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { MachineryModule } from './machinery/machinery.module';
import { InventoryModule } from './inventory/inventory.module';
import { FuelModule } from './fuel/fuel.module';
import { HrModule } from './hr/hr.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProjectsModule,
    MachineryModule,
    InventoryModule,
    FuelModule,
    HrModule,
    ReportsModule,
    DashboardModule,
  ],
})
export class AppModule {}
