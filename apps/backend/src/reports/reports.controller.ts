import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { SubmitDailyReportDto } from './dto/submit-daily-report.dto';

@ApiTags('Daily Site Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Permissions('reports:view')
  @ApiOperation({ summary: 'List all daily site reports' })
  findAll(@CurrentUser('companyId') companyId: string) {
    return this.reportsService.findAll(companyId);
  }

  @Post()
  @Permissions('attendance:create')
  @ApiOperation({ summary: 'Submit or edit daily site report' })
  createReport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() submitDailyReportDto: SubmitDailyReportDto,
  ) {
    return this.reportsService.createReport(user.companyId, {
      ...submitDailyReportDto,
      date: new Date(submitDailyReportDto.date),
      submittedById: user.id,
    });
  }
}
