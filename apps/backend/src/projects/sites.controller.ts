import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SitesService } from './sites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@ApiTags('Projects & Sites')
@Controller()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get('projects/:projectId/sites')
  @Permissions('sites:view')
  @ApiOperation({ summary: 'List all sites under a specific project' })
  @ApiResponse({ status: 200, description: 'Sites list retrieved' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findAllForProject(
    @Param('projectId') projectId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.sitesService.findAllForProject(projectId, companyId);
  }

  @Post('projects/:projectId/sites')
  @Permissions('sites:create')
  @ApiOperation({ summary: 'Create a new site location under a project' })
  @ApiResponse({ status: 201, description: 'Site created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() createSiteDto: CreateSiteDto,
  ) {
    return this.sitesService.create(user.companyId, projectId, user.id, createSiteDto);
  }

  @Get('sites/:id')
  @Permissions('sites:view')
  @ApiOperation({ summary: 'Get details of a specific site' })
  @ApiResponse({ status: 200, description: 'Site details retrieved' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.sitesService.findOne(id, companyId);
  }

  @Patch('sites/:id')
  @Permissions('sites:update')
  @ApiOperation({ summary: 'Modify site location details' })
  @ApiResponse({ status: 200, description: 'Site updated successfully' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateSiteDto: UpdateSiteDto,
  ) {
    return this.sitesService.update(id, user.companyId, user.id, updateSiteDto);
  }

  @Delete('sites/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('sites:delete')
  @ApiOperation({ summary: 'Soft delete a site' })
  @ApiResponse({ status: 204, description: 'Site soft deleted' })
  @ApiResponse({ status: 404, description: 'Site not found' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.sitesService.remove(id, user.companyId, user.id);
  }
}
