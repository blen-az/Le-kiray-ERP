import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { HrService } from './hr.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateEmployeeAssignmentDto } from './dto/create-employee-assignment.dto';
import { UpdateEmployeeAssignmentDto } from './dto/update-employee-assignment.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { ApproveLeaveRequestDto } from './dto/approve-leave-request.dto';
import { RejectLeaveRequestDto } from './dto/reject-leave-request.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('HR & Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  // ==================== EMPLOYEES ====================

  @Post('employees')
  @Permissions('hr:create')
  @ApiOperation({ summary: 'Create new employee profile' })
  createEmployee(@CurrentUser() user: any, @Body() dto: CreateEmployeeDto) {
    return this.hrService.createEmployee(user.companyId, user.id, dto);
  }

  @Get('employees')
  @Permissions('hr:view')
  @ApiOperation({ summary: 'List all employees' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'position', required: false })
  @ApiQuery({ name: 'employmentType', required: false })
  @ApiQuery({ name: 'employmentStatus', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'siteId', required: false })
  findAllEmployees(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('position') position?: string,
    @Query('employmentType') employmentType?: string,
    @Query('employmentStatus') employmentStatus?: string,
    @Query('projectId') projectId?: string,
    @Query('siteId') siteId?: string,
  ) {
    return this.hrService.findAllEmployees(user.companyId, {
      search,
      position,
      employmentType,
      employmentStatus,
      projectId,
      siteId,
    });
  }

  @Get('employees/:id')
  @Permissions('hr:view')
  @ApiOperation({ summary: 'Get employee details' })
  findOneEmployee(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.findOneEmployee(id, user.companyId);
  }

  @Patch('employees/:id')
  @Permissions('hr:update')
  @ApiOperation({ summary: 'Update employee record' })
  updateEmployee(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeDto,
  ) {
    return this.hrService.updateEmployee(id, user.companyId, user.id, dto);
  }

  @Delete('employees/:id')
  @Permissions('hr:delete')
  @ApiOperation({ summary: 'Soft delete employee record' })
  removeEmployee(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.removeEmployee(id, user.companyId);
  }

  // ==================== EMPLOYEE ASSIGNMENTS ====================

  @Post('assignments')
  @Permissions('hr:assign')
  @ApiOperation({ summary: 'Assign employee to project/site' })
  createAssignment(@CurrentUser() user: any, @Body() dto: CreateEmployeeAssignmentDto) {
    return this.hrService.createAssignment(user.companyId, user.id, dto);
  }

  @Get('assignments')
  @Permissions('hr:view')
  @ApiOperation({ summary: 'List employee assignments' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'siteId', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAllAssignments(
    @CurrentUser() user: any,
    @Query('employeeId') employeeId?: string,
    @Query('projectId') projectId?: string,
    @Query('siteId') siteId?: string,
    @Query('status') status?: string,
  ) {
    return this.hrService.findAllAssignments(user.companyId, {
      employeeId,
      projectId,
      siteId,
      status,
    });
  }

  @Get('assignments/:id')
  @Permissions('hr:view')
  @ApiOperation({ summary: 'Get assignment detail' })
  findOneAssignment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.findOneAssignment(id, user.companyId);
  }

  @Patch('assignments/:id')
  @Permissions('hr:assign')
  @ApiOperation({ summary: 'Update assignment' })
  updateAssignment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateEmployeeAssignmentDto,
  ) {
    return this.hrService.updateAssignment(id, user.companyId, user.id, dto);
  }

  @Delete('assignments/:id')
  @Permissions('hr:assign')
  @ApiOperation({ summary: 'Soft delete assignment' })
  removeAssignment(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.removeAssignment(id, user.companyId);
  }

  // ==================== ATTENDANCE ====================

  @Post('attendance')
  @Permissions('attendance:create')
  @ApiOperation({ summary: 'Record daily site attendance' })
  createAttendance(@CurrentUser() user: any, @Body() dto: CreateAttendanceDto) {
    return this.hrService.createAttendance(user.companyId, user.id, dto);
  }

  @Get('attendance')
  @Permissions('attendance:view')
  @ApiOperation({ summary: 'List attendance logs' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'siteId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  findAllAttendance(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('employeeId') employeeId?: string,
    @Query('projectId') projectId?: string,
    @Query('siteId') siteId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.hrService.findAllAttendance(user.companyId, {
      search,
      employeeId,
      projectId,
      siteId,
      status,
      startDate,
      endDate,
    });
  }

  @Get('attendance/:id')
  @Permissions('attendance:view')
  @ApiOperation({ summary: 'Get attendance record' })
  findOneAttendance(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.findOneAttendance(id, user.companyId);
  }

  @Patch('attendance/:id')
  @Permissions('attendance:update')
  @ApiOperation({ summary: 'Update attendance record' })
  updateAttendance(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateAttendanceDto,
  ) {
    return this.hrService.updateAttendance(id, user.companyId, user.id, dto);
  }

  @Delete('attendance/:id')
  @Permissions('attendance:delete')
  @ApiOperation({ summary: 'Soft delete attendance record' })
  removeAttendance(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.removeAttendance(id, user.companyId);
  }

  // ==================== LEAVE REQUESTS ====================

  @Post('leave-requests')
  @Permissions('leave:create')
  @ApiOperation({ summary: 'Submit leave request' })
  createLeaveRequest(@CurrentUser() user: any, @Body() dto: CreateLeaveRequestDto) {
    return this.hrService.createLeaveRequest(user.companyId, user.id, dto);
  }

  @Get('leave-requests')
  @Permissions('leave:view')
  @ApiOperation({ summary: 'List leave requests' })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'leaveType', required: false })
  findAllLeaveRequests(
    @CurrentUser() user: any,
    @Query('employeeId') employeeId?: string,
    @Query('status') status?: string,
    @Query('leaveType') leaveType?: string,
  ) {
    return this.hrService.findAllLeaveRequests(user.companyId, {
      employeeId,
      status,
      leaveType,
    });
  }

  @Get('leave-requests/:id')
  @Permissions('leave:view')
  @ApiOperation({ summary: 'Get leave request details' })
  findOneLeaveRequest(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.findOneLeaveRequest(id, user.companyId);
  }

  @Post('leave-requests/:id/approve')
  @Permissions('leave:approve')
  @ApiOperation({ summary: 'Approve leave request' })
  approveLeaveRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: ApproveLeaveRequestDto,
  ) {
    return this.hrService.approveLeaveRequest(id, user.companyId, user.id, dto);
  }

  @Post('leave-requests/:id/reject')
  @Permissions('leave:reject')
  @ApiOperation({ summary: 'Reject leave request' })
  rejectLeaveRequest(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: RejectLeaveRequestDto,
  ) {
    return this.hrService.rejectLeaveRequest(id, user.companyId, user.id, dto);
  }

  @Delete('leave-requests/:id')
  @Permissions('leave:create')
  @ApiOperation({ summary: 'Soft delete leave request' })
  removeLeaveRequest(@CurrentUser() user: any, @Param('id') id: string) {
    return this.hrService.removeLeaveRequest(id, user.companyId);
  }

  // ==================== HR REPORTS ====================

  @Get('reports/summary')
  @Permissions('hr:reports')
  @ApiOperation({ summary: 'Get HR & Attendance executive summary' })
  getSummaryReport(@CurrentUser() user: any) {
    return this.hrService.getSummaryReport(user.companyId);
  }

  @Get('reports/by-project')
  @Permissions('hr:reports')
  @ApiOperation({ summary: 'Get workforce breakdown by project' })
  getByProjectReport(@CurrentUser() user: any) {
    return this.hrService.getByProjectReport(user.companyId);
  }

  @Get('reports/by-site')
  @Permissions('hr:reports')
  @ApiOperation({ summary: 'Get workforce breakdown by site' })
  getBySiteReport(@CurrentUser() user: any) {
    return this.hrService.getBySiteReport(user.companyId);
  }

  @Get('reports/attendance')
  @Permissions('hr:reports')
  @ApiOperation({ summary: 'Get 30-day attendance audit report' })
  getAttendanceReport(@CurrentUser() user: any) {
    return this.hrService.getAttendanceReport(user.companyId);
  }

  @Get('reports/operators')
  @Permissions('hr:reports')
  @ApiOperation({ summary: 'Get fleet operator HR status report' })
  getOperatorsReport(@CurrentUser() user: any) {
    return this.hrService.getOperatorsReport(user.companyId);
  }
}
