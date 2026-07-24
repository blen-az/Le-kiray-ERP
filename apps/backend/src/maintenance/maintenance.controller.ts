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
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { StartMaintenanceDto } from './dto/start-maintenance.dto';
import { CompleteMaintenanceDto } from './dto/complete-maintenance.dto';
import { CancelMaintenanceDto } from './dto/cancel-maintenance.dto';

@ApiTags('Maintenance Management')
@Controller('maintenance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  @Permissions('maintenance:view')
  @ApiOperation({ summary: 'List maintenance records with search, machine, project, site, and status filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'machineId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'siteId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'maintenanceType', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query('search') search?: string,
    @Query('machineId') machineId?: string,
    @Query('projectId') projectId?: string,
    @Query('siteId') siteId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('maintenanceType') maintenanceType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.maintenanceService.findAll(companyId, {
      search,
      machineId,
      projectId,
      siteId,
      status,
      priority,
      maintenanceType,
      startDate,
      endDate,
    });
  }

  @Post()
  @Permissions('maintenance:create')
  @ApiOperation({ summary: 'Create new heavy machinery maintenance record' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMaintenanceDto,
  ) {
    return this.maintenanceService.create(user.companyId, user.id, dto);
  }

  @Get('schedule/upcoming')
  @Permissions('maintenance:view')
  @ApiOperation({ summary: 'Get upcoming, overdue, and next service maintenance schedules' })
  getUpcomingSchedule(@CurrentUser('companyId') companyId: string) {
    return this.maintenanceService.getUpcomingSchedule(companyId);
  }

  @Get('reports/summary')
  @Permissions('maintenance:reports')
  @ApiOperation({ summary: 'Get aggregated maintenance cost and downtime summary' })
  getSummaryReport(@CurrentUser('companyId') companyId: string) {
    return this.maintenanceService.getSummaryReport(companyId);
  }

  @Get('reports/by-machine')
  @Permissions('maintenance:reports')
  @ApiOperation({ summary: 'Get maintenance costs and downtime aggregated by machine asset' })
  getReportByMachine(@CurrentUser('companyId') companyId: string) {
    return this.maintenanceService.getReportByMachine(companyId);
  }

  @Get('reports/by-project')
  @Permissions('maintenance:reports')
  @ApiOperation({ summary: 'Get maintenance costs aggregated by project contract' })
  getReportByProject(@CurrentUser('companyId') companyId: string) {
    return this.maintenanceService.getReportByProject(companyId);
  }

  @Get('by-machine/:machineId')
  @Permissions('maintenance:view')
  @ApiOperation({ summary: 'Get maintenance records history for a specific heavy equipment machine' })
  findByMachine(
    @Param('machineId') machineId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.maintenanceService.findByMachine(machineId, companyId);
  }

  @Get(':id')
  @Permissions('maintenance:view')
  @ApiOperation({ summary: 'Get detailed maintenance record by ID' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.maintenanceService.findOne(id, companyId);
  }

  @Patch(':id')
  @Permissions('maintenance:update')
  @ApiOperation({ summary: 'Update an open maintenance record' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMaintenanceDto,
  ) {
    return this.maintenanceService.update(id, user.companyId, user.id, dto);
  }

  @Delete(':id')
  @Permissions('maintenance:delete')
  @ApiOperation({ summary: 'Soft delete a maintenance record' })
  delete(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.maintenanceService.delete(id, companyId);
  }

  @Post(':id/start')
  @Permissions('maintenance:start')
  @ApiOperation({ summary: 'Start maintenance work and set machine status to Under Maintenance' })
  start(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: StartMaintenanceDto,
  ) {
    return this.maintenanceService.start(id, user.companyId, user.id, dto);
  }

  @Post(':id/complete')
  @Permissions('maintenance:complete')
  @ApiOperation({ summary: 'Complete maintenance, record costs/parts/downtime, and restore machine status' })
  complete(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CompleteMaintenanceDto,
  ) {
    return this.maintenanceService.complete(id, user.companyId, user.id, dto);
  }

  @Post(':id/cancel')
  @Permissions('maintenance:cancel')
  @ApiOperation({ summary: 'Cancel maintenance record and restore machine availability' })
  cancel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CancelMaintenanceDto,
  ) {
    return this.maintenanceService.cancel(id, user.companyId, user.id, dto);
  }
}
