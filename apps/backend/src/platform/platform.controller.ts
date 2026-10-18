import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { PlatformAdminGuard } from './platform-admin.guard';
import { PlatformService } from './platform.service';
import { OnboardCompanyDto, ResetOwnerPasswordDto, UpdateCompanyDto } from './dto/platform.dto';

/** Le’Kiray operator console. Cross-tenant by design — every route requires PlatformAdminGuard. */
@ApiTags('Platform Administration')
@Controller('platform')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@ApiBearerAuth()
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform-wide company and user counts' })
  stats() {
    return this.platformService.stats();
  }

  @Get('companies')
  @ApiOperation({ summary: 'List all contractor companies with owners and activity' })
  listCompanies() {
    return this.platformService.listCompanies();
  }

  @Post('companies')
  @ApiOperation({ summary: 'Onboard a company: creates workspace, roles, and owner with a one-time temporary password' })
  onboard(@CurrentUser() user: AuthenticatedUser, @Body() dto: OnboardCompanyDto) {
    return this.platformService.onboard(user, dto);
  }

  @Patch('companies/:id')
  @ApiOperation({ summary: 'Edit company details or suspend/reactivate it' })
  update(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateCompanyDto) {
    return this.platformService.update(user, id, dto);
  }

  @Post('companies/:id/reset-owner-password')
  @ApiOperation({ summary: 'Issue a new temporary password for a company owner who is locked out' })
  resetOwnerPassword(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: ResetOwnerPasswordDto) {
    return this.platformService.resetOwnerPassword(user, id, dto);
  }
}
