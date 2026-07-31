import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { MachineryModule } from './machinery/machinery.module';
import { InventoryModule } from './inventory/inventory.module';
import { FuelModule } from './fuel/fuel.module';
import { HrModule } from './hr/hr.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MaintenanceModule } from './maintenance/maintenance.module';
import { FinanceModule } from './finance/finance.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: parseInt(process.env.RATE_LIMIT_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
      },
    ]),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    MachineryModule,
    InventoryModule,
    FuelModule,
    HrModule,
    ReportsModule,
    DashboardModule,
    MaintenanceModule,
    FinanceModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
