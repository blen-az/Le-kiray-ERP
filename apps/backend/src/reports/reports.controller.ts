import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateDailyReportDto } from './dto/create-daily-report.dto';
import { UpdateDailyReportDto } from './dto/update-daily-report.dto';
import { ApproveDailyReportDto } from './dto/approve-daily-report.dto';
import { RejectDailyReportDto } from './dto/reject-daily-report.dto';

@ApiTags('Daily Site Reports')
@Controller('reports/daily-site')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @Permissions('reports:view')
  @ApiOperation({ summary: 'List daily site reports with search, project, site, and status filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'siteId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query('search') search?: string,
    @Query('projectId') projectId?: string,
    @Query('siteId') siteId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.findAll(companyId, {
      search,
      projectId,
      siteId,
      status,
      startDate,
      endDate,
    });
  }

  @Post()
  @Permissions('reports:create')
  @ApiOperation({ summary: 'Create new daily site report (Draft or Submitted)' })
  createReport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDailyReportDto,
  ) {
    return this.reportsService.createReport(user.companyId, user.id, dto);
  }

  @Get('today')
  @Permissions('reports:view')
  @ApiOperation({ summary: "Get today's report submission status across all active company sites" })
  getTodayStatus(@CurrentUser('companyId') companyId: string) {
    return this.reportsService.getTodayStatus(companyId);
  }

  @Get('summary')
  @Permissions('reports:view')
  @ApiOperation({ summary: 'Get summary KPIs and analytics for daily site reports' })
  getSummaryStats(@CurrentUser('companyId') companyId: string) {
    return this.reportsService.getSummaryStats(companyId);
  }

  @Get('by-project/:projectId')
  @Permissions('reports:view')
  @ApiOperation({ summary: 'Get daily site reports for a specific project' })
  findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.reportsService.findByProject(projectId, companyId);
  }

  @Get('by-site/:siteId')
  @Permissions('reports:view')
  @ApiOperation({ summary: 'Get daily site reports for a specific site plot' })
  findBySite(
    @Param('siteId') siteId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.reportsService.findBySite(siteId, companyId);
  }

  @Get(':id')
  @Permissions('reports:view')
  @ApiOperation({ summary: 'Get detailed daily site report by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.reportsService.findOne(id, companyId);
  }

  @Patch(':id')
  @Permissions('reports:update')
  @ApiOperation({ summary: 'Update draft or rejected daily site report' })
  updateReport(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateDailyReportDto,
  ) {
    return this.reportsService.updateReport(id, user.companyId, user.id, dto);
  }

  @Delete(':id')
  @Permissions('reports:delete')
  @ApiOperation({ summary: 'Soft delete a daily site report' })
  deleteReport(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.reportsService.deleteReport(id, companyId);
  }

  @Post(':id/submit')
  @Permissions('reports:submit')
  @ApiOperation({ summary: 'Submit a draft daily site report' })
  submitReport(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.submitReport(id, user.companyId, user.id);
  }

  @Post(':id/approve')
  @Permissions('reports:approve')
  @ApiOperation({ summary: 'Approve a submitted daily site report' })
  approveReport(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApproveDailyReportDto,
  ) {
    return this.reportsService.approveReport(id, user.companyId, user.id, dto.approvalNotes);
  }

  @Post(':id/reject')
  @Permissions('reports:reject')
  @ApiOperation({ summary: 'Reject a submitted daily site report with rationale' })
  rejectReport(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RejectDailyReportDto,
  ) {
    return this.reportsService.rejectReport(id, user.companyId, user.id, dto.rejectionReason);
  }
}
