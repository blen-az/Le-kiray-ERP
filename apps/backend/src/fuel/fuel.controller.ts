import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { FuelService } from './fuel.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateFuelRequestDto } from './dto/create-fuel-request.dto';
import { UpdateFuelRequestDto } from './dto/update-fuel-request.dto';
import { ApproveFuelRequestDto } from './dto/approve-fuel-request.dto';
import { RejectFuelRequestDto } from './dto/reject-fuel-request.dto';
import { IssueFuelRequestDto } from './dto/issue-fuel-request.dto';
import { CreateFuelLogDto } from './dto/create-fuel-log.dto';
import { UpdateFuelLogDto } from './dto/update-fuel-log.dto';

@ApiTags('Fuel Management')
@Controller('fuel')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class FuelController {
  constructor(private readonly fuelService: FuelService) {}

  // --- Requests ---

  @Get('requests')
  @Permissions('fuel:view')
  @ApiOperation({ summary: 'List all machinery fuel requests' })
  findAllRequests(@CurrentUser('companyId') companyId: string) {
    return this.fuelService.findAllRequests(companyId);
  }

  @Get('requests/:id')
  @Permissions('fuel:view')
  @ApiOperation({ summary: 'Get details of a specific fuel request' })
  findOneRequest(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.fuelService.findOneRequest(id, companyId);
  }

  @Post('requests')
  @Permissions('fuel:request')
  @ApiOperation({ summary: 'Submit a new machinery fuel request' })
  createRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createFuelRequestDto: CreateFuelRequestDto,
  ) {
    return this.fuelService.createRequest(user.companyId, user.id, createFuelRequestDto);
  }

  @Patch('requests/:id')
  @Permissions('fuel:update')
  @ApiOperation({ summary: 'Modify a pending fuel request' })
  updateRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateFuelRequestDto: UpdateFuelRequestDto,
  ) {
    return this.fuelService.updateRequest(id, user.companyId, user.id, updateFuelRequestDto);
  }

  @Post('requests/:id/approve')
  @Permissions('fuel:approve')
  @ApiOperation({ summary: 'Approve a pending fuel request' })
  approveRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() approveDto: ApproveFuelRequestDto,
  ) {
    return this.fuelService.approveRequest(id, user.companyId, user.id, approveDto);
  }

  @Post('requests/:id/reject')
  @Permissions('fuel:reject')
  @ApiOperation({ summary: 'Reject a pending fuel request' })
  rejectRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() rejectDto: RejectFuelRequestDto,
  ) {
    return this.fuelService.rejectRequest(id, user.companyId, user.id, rejectDto);
  }

  @Post('requests/:id/issue')
  @Permissions('fuel:issue')
  @ApiOperation({ summary: 'Issue fuel against an approved request' })
  issueRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() issueDto: IssueFuelRequestDto,
  ) {
    return this.fuelService.issueRequest(id, user.companyId, user.id, issueDto);
  }

  @Delete('requests/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('fuel:delete')
  @ApiOperation({ summary: 'Cancel/Delete a fuel request' })
  deleteRequest(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.fuelService.deleteRequest(id, user.companyId, user.id);
  }

  // --- Logs ---

  @Get('logs')
  @Permissions('fuel:view')
  @ApiOperation({ summary: 'List all actual fuel logs' })
  findAllLogs(@CurrentUser('companyId') companyId: string) {
    return this.fuelService.findAllLogs(companyId);
  }

  @Get('logs/:id')
  @Permissions('fuel:view')
  @ApiOperation({ summary: 'Get details of a fuel log' })
  findOneLog(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.fuelService.findOneLog(id, companyId);
  }

  @Post('logs')
  @Permissions('fuel:log')
  @ApiOperation({ summary: 'Record a manual fuel log' })
  createLog(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createFuelLogDto: CreateFuelLogDto,
  ) {
    return this.fuelService.createLog(user.companyId, user.id, createFuelLogDto);
  }

  @Patch('logs/:id')
  @Permissions('fuel:update')
  @ApiOperation({ summary: 'Update fuel log details' })
  updateLog(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateLogDto: UpdateFuelLogDto,
  ) {
    return this.fuelService.updateLog(id, user.companyId, user.id, updateLogDto);
  }

  @Delete('logs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('fuel:delete')
  @ApiOperation({ summary: 'Delete a fuel log' })
  deleteLog(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.fuelService.deleteLog(id, user.companyId, user.id);
  }

  // --- Reports ---

  @Get('reports/summary')
  @Permissions('fuel:reports')
  @ApiOperation({ summary: 'Get fuel consumption cost summary' })
  getSummary(@CurrentUser('companyId') companyId: string) {
    return this.fuelService.getSummary(companyId);
  }

  @Get('reports/by-project')
  @Permissions('fuel:reports')
  @ApiOperation({ summary: 'Get fuel cost grouped by project' })
  getByProject(@CurrentUser('companyId') companyId: string) {
    return this.fuelService.getByProject(companyId);
  }

  @Get('reports/by-machine')
  @Permissions('fuel:reports')
  @ApiOperation({ summary: 'Get fuel cost grouped by machinery' })
  getByMachine(@CurrentUser('companyId') companyId: string) {
    return this.fuelService.getByMachine(companyId);
  }

  @Get('reports/by-operator')
  @Permissions('fuel:reports')
  @ApiOperation({ summary: 'Get fuel usage grouped by operator' })
  getByOperator(@CurrentUser('companyId') companyId: string) {
    return this.fuelService.getByOperator(companyId);
  }
}
