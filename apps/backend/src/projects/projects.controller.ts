import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@ApiTags('Projects & Sites')
@Controller('projects')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Permissions('projects:view')
  @ApiOperation({ summary: 'List all company projects' })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  findAll(@CurrentUser('companyId') companyId: string) {
    return this.projectsService.findAll(companyId);
  }

  @Get('users/managers')
  @Permissions('projects:view')
  @ApiOperation({ summary: 'List all company users eligible for assignment as project or site managers' })
  findCompanyUsers(@CurrentUser('companyId') companyId: string) {
    return this.projectsService.findCompanyUsers(companyId);
  }

  @Get(':id')
  @Permissions('projects:view')
  @ApiOperation({ summary: 'Get details of a specific project' })
  @ApiResponse({ status: 200, description: 'Project details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.projectsService.findOne(id, companyId);
  }

  @Post()
  @Permissions('projects:create')
  @ApiOperation({ summary: 'Register a new project workspace' })
  @ApiResponse({ status: 201, description: 'Project registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation or date integrity error' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() createProjectDto: CreateProjectDto,
  ) {
    return this.projectsService.create(user.companyId, user.id, createProjectDto);
  }

  @Patch(':id')
  @Permissions('projects:update')
  @ApiOperation({ summary: 'Modify project details' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectsService.update(id, user.companyId, user.id, updateProjectDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('projects:delete')
  @ApiOperation({ summary: 'Soft delete a project and its sites' })
  @ApiResponse({ status: 204, description: 'Project soft deleted' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.projectsService.remove(id, user.companyId, user.id);
  }
}
