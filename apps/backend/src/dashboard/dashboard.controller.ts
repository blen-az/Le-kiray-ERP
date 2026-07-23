import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Dashboard Metrics')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('ceo')
  @ApiOperation({ summary: 'Get KPI statistics and highlights for the CEO / Owner dashboard' })
  getCeoStats(@CurrentUser('companyId') companyId: string) {
    return this.dashboardService.getCeoStats(companyId);
  }
}
