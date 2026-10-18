import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';
import { RolesService } from './roles.service';
import { CreateRoleDto, CreateUserDto, UpdateRoleDto, UpdateUserDto } from './dto/users.dto';

@ApiTags('Users & Access')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('users:view')
  @ApiOperation({ summary: 'List workspace users with roles and account status' })
  findAll(@CurrentUser('companyId') companyId: string) {
    return this.usersService.findAll(companyId);
  }

  @Post()
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Add a user; returns a one-time temporary password' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateUserDto) {
    return this.usersService.create(user, dto);
  }

  @Patch(':id')
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Update name, roles, or active status' })
  update(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user, id, dto);
  }

  @Post(':id/reset-password')
  @Permissions('users:manage')
  @ApiOperation({ summary: 'Issue a new one-time temporary password and sign the user out' })
  resetPassword(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.resetPassword(user, id);
  }
}

@ApiTags('Users & Access')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('users:view')
  @ApiOperation({ summary: 'List roles with permissions and user counts' })
  findAll(@CurrentUser('companyId') companyId: string) {
    return this.rolesService.findAll(companyId);
  }

  @Get('permissions')
  @Permissions('users:view')
  @ApiOperation({ summary: 'Permission catalogue grouped by module' })
  listPermissions() {
    return this.rolesService.listPermissions();
  }

  @Post()
  @Permissions('roles:manage')
  @ApiOperation({ summary: 'Create a custom role' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(user, dto);
  }

  @Patch(':id')
  @Permissions('roles:manage')
  @ApiOperation({ summary: 'Rename a role or change its permissions' })
  update(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(user, id, dto);
  }

  @Delete(':id')
  @Permissions('roles:manage')
  @ApiOperation({ summary: 'Delete a role that no users hold' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.rolesService.delete(user, id);
  }
}
