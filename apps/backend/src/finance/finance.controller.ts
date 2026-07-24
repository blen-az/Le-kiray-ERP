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
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ApproveExpenseDto } from './dto/approve-expense.dto';
import { CreateProjectRevenueDto } from './dto/create-project-revenue.dto';

@ApiTags('Finance Lite Management')
@Controller('finance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  @Permissions('finance:view')
  @ApiOperation({ summary: 'Get aggregated operational cost summary for company' })
  getSummary(@CurrentUser('companyId') companyId: string) {
    return this.financeService.getSummary(companyId);
  }

  @Get('by-project')
  @Permissions('finance:view')
  @ApiOperation({ summary: 'Get cost breakdown aggregated by project contract' })
  getByProject(@CurrentUser('companyId') companyId: string) {
    return this.financeService.getByProject(companyId);
  }

  @Get('by-site')
  @Permissions('finance:view')
  @ApiOperation({ summary: 'Get cost breakdown aggregated by construction site compound' })
  getBySite(@CurrentUser('companyId') companyId: string) {
    return this.financeService.getBySite(companyId);
  }

  @Get('by-machine')
  @Permissions('finance:view')
  @ApiOperation({ summary: 'Get cost breakdown aggregated by heavy machinery asset' })
  getByMachine(@CurrentUser('companyId') companyId: string) {
    return this.financeService.getByMachine(companyId);
  }

  @Get('cost-breakdown')
  @Permissions('finance:view')
  @ApiOperation({ summary: 'Get cost totals grouped by operational category' })
  getCostBreakdown(@CurrentUser('companyId') companyId: string) {
    return this.financeService.getCostBreakdown(companyId);
  }

  @Get('project-profitability')
  @Permissions('finance:profitability')
  @ApiOperation({ summary: 'Get project profitability, estimated gross margin, and cost risk status' })
  getProjectProfitability(@CurrentUser('companyId') companyId: string) {
    return this.financeService.getProjectProfitability(companyId);
  }

  @Get('expenses')
  @Permissions('finance:view')
  @ApiOperation({ summary: 'List manual operational expenses with multi-field search and filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'siteId', required: false })
  @ApiQuery({ name: 'machineId', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAllExpenses(
    @CurrentUser('companyId') companyId: string,
    @Query('search') search?: string,
    @Query('projectId') projectId?: string,
    @Query('siteId') siteId?: string,
    @Query('machineId') machineId?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.financeService.findAllExpenses(companyId, {
      search,
      projectId,
      siteId,
      machineId,
      category,
      status,
      startDate,
      endDate,
    });
  }

  @Post('expenses')
  @Permissions('finance:create')
  @ApiOperation({ summary: 'Record a new manual operational expense' })
  createExpense(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.financeService.createExpense(user.companyId, user.id, dto);
  }

  @Get('expenses/:id')
  @Permissions('finance:view')
  @ApiOperation({ summary: 'Get detailed expense record by ID' })
  findOneExpense(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.financeService.findOneExpense(id, companyId);
  }

  @Patch('expenses/:id')
  @Permissions('finance:update')
  @ApiOperation({ summary: 'Update an open expense record' })
  updateExpense(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.financeService.updateExpense(id, user.companyId, user.id, dto);
  }

  @Post('expenses/:id/approve')
  @Permissions('finance:approve')
  @ApiOperation({ summary: 'Approve or reject an operational expense record' })
  approveExpense(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ApproveExpenseDto,
  ) {
    return this.financeService.approveExpense(id, user.companyId, user.id, dto);
  }

  @Delete('expenses/:id')
  @Permissions('finance:delete')
  @ApiOperation({ summary: 'Soft delete an expense record' })
  deleteExpense(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.financeService.deleteExpense(id, companyId);
  }

  @Get('reports/monthly')
  @Permissions('finance:reports')
  @ApiOperation({ summary: 'Get 6-month historical operational cost trends' })
  getMonthlyReport(@CurrentUser('companyId') companyId: string) {
    return this.financeService.getMonthlyReport(companyId);
  }

  @Get('reports/project/:projectId')
  @Permissions('finance:reports')
  @ApiOperation({ summary: 'Get detailed financial & operational report for a specific project' })
  getProjectDetailReport(
    @Param('projectId') projectId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.financeService.getProjectDetailReport(projectId, companyId);
  }

  @Post('revenue')
  @Permissions('finance:create')
  @ApiOperation({ summary: 'Record project revenue or contract value entry' })
  createProjectRevenue(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateProjectRevenueDto,
  ) {
    return this.financeService.createProjectRevenue(user.companyId, user.id, dto);
  }
}
