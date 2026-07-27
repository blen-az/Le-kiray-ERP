import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { MachineryService } from './machinery.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { AssignMachineDto } from './dto/assign-machine.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@ApiTags('Machinery')
@Controller('machinery')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class MachineryController {
  constructor(private readonly machineryService: MachineryService) {}

  @Get()
  @Permissions('machinery:view')
  @ApiOperation({ summary: 'List all company machinery' })
  @ApiResponse({ status: 200, description: 'Machinery fleet retrieved' })
  findAll(@CurrentUser('companyId') companyId: string) {
    return this.machineryService.findAll(companyId);
  }

  @Get(':id')
  @Permissions('machinery:view')
  @ApiOperation({ summary: 'Get details of a specific machine' })
  @ApiResponse({ status: 200, description: 'Machine details retrieved' })
  @ApiResponse({ status: 404, description: 'Machine not found' })
  findOne(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.machineryService.findOne(id, companyId);
  }

  @Post()
  @Permissions('machinery:create')
  @ApiOperation({ summary: 'Add a new heavy machine to the fleet' })
  @ApiResponse({ status: 201, description: 'Machine created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createMachineDto: CreateMachineDto,
  ) {
    return this.machineryService.create(user.companyId, user.id, createMachineDto);
  }

  @Patch(':id')
  @Permissions('machinery:update')
  @ApiOperation({ summary: 'Modify machine details' })
  @ApiResponse({ status: 200, description: 'Machine updated successfully' })
  @ApiResponse({ status: 404, description: 'Machine not found' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateMachineDto: UpdateMachineDto,
  ) {
    return this.machineryService.update(id, user.companyId, user.id, updateMachineDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('machinery:delete')
  @ApiOperation({ summary: 'Soft delete a machine and its assignments' })
  @ApiResponse({ status: 204, description: 'Machine soft deleted' })
  @ApiResponse({ status: 404, description: 'Machine not found' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.machineryService.remove(id, user.companyId, user.id);
  }

  @Post(':id/assign')
  @Permissions('machinery:assign')
  @ApiOperation({ summary: 'Assign a heavy machine to a construction project' })
  @ApiResponse({ status: 201, description: 'Machine assigned' })
  @ApiResponse({ status: 400, description: 'Validation or project boundary checks failed' })
  assign(
    @Param('id') machineId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() assignMachineDto: AssignMachineDto,
  ) {
    return this.machineryService.assign(user.companyId, machineId, user.id, assignMachineDto);
  }

  @Patch('assignments/:assignmentId')
  @Permissions('machinery:update')
  @ApiOperation({ summary: 'Update assignment hours or process return transitions' })
  @ApiResponse({ status: 200, description: 'Assignment updated' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  updateAssignment(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ) {
    return this.machineryService.updateAssignment(assignmentId, user.companyId, user.id, updateAssignmentDto);
  }

  @Delete('assignments/:assignmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('machinery:return')
  @ApiOperation({ summary: 'Cancel/Delete a machine assignment' })
  @ApiResponse({ status: 204, description: 'Assignment deleted' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  removeAssignment(
    @Param('assignmentId') assignmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.machineryService.removeAssignment(assignmentId, user.companyId, user.id);
  }

  @Get(':id/assignments')
  @Permissions('machinery:view')
  @ApiOperation({ summary: 'List all assignments of a specific machine' })
  findAssignments(
    @Param('id') machineId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.machineryService.findAssignments(machineId, companyId);
  }

  @Get(':id/history')
  @Permissions('machinery:history')
  @ApiOperation({ summary: 'Get timeline logs of machine events' })
  findHistory(
    @Param('id') machineId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.machineryService.findHistory(machineId, companyId);
  }
}
