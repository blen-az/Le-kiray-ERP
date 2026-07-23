import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { RecordAttendanceDto } from './dto/record-attendance.dto';

@ApiTags('Human Resources & Attendance')
@Controller('hr')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('employees')
  @Permissions('projects:view')
  @ApiOperation({ summary: 'List all company employees' })
  findAllEmployees(@CurrentUser('companyId') companyId: string) {
    return this.hrService.findAllEmployees(companyId);
  }

  @Post('employees')
  @Permissions('attendance:create')
  @ApiOperation({ summary: 'Add a new employee to roster' })
  createEmployee(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    return this.hrService.createEmployee(user.companyId, {
      ...createEmployeeDto,
      createdById: user.id,
    });
  }

  @Get('attendance')
  @Permissions('projects:view')
  @ApiOperation({ summary: 'Get daily site attendance log' })
  getAttendanceReport(
    @CurrentUser('companyId') companyId: string,
    @Query('date') dateString?: string,
  ) {
    const targetDate = dateString ? new Date(dateString) : new Date();
    return this.hrService.getAttendanceReport(companyId, targetDate);
  }

  @Post('attendance')
  @Permissions('attendance:create')
  @ApiOperation({ summary: 'Log or update daily attendance card for an employee' })
  recordAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Body() recordAttendanceDto: RecordAttendanceDto,
  ) {
    return this.hrService.recordAttendance(user.companyId, {
      ...recordAttendanceDto,
      date: new Date(recordAttendanceDto.date),
      recordedById: user.id,
    });
  }
}
