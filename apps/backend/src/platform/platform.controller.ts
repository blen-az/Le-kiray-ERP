import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { PlatformAdminGuard } from './platform-admin.guard';
import { PlatformService } from './platform.service';
import { TenderBoardService } from '../tenders/tender-board.service';
import { CreateTenderNoticeDto, UpdateTenderNoticeDto } from '../tenders/dto/tender-notice.dto';
import { OnboardCompanyDto, ResetOwnerPasswordDto, UpdateCompanyDto } from './dto/platform.dto';

/** Le’Kiray operator console. Cross-tenant by design — every route requires PlatformAdminGuard. */
@ApiTags('Platform Administration')
@Controller('platform')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
@ApiBearerAuth()
export class PlatformController {
  constructor(
    private readonly platformService: PlatformService,
    private readonly tenderBoardService: TenderBoardService,
  ) {}

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

  // ── Shared Tender Board ──

  @Get('tender-notices')
  @ApiOperation({ summary: 'All Tender Board notices with how many companies track each' })
  listNotices() {
    return this.tenderBoardService.listAll();
  }

  @Post('tender-notices')
  @ApiOperation({ summary: 'Publish a tender notice to every company' })
  createNotice(@CurrentUser('id') userId: string, @Body() dto: CreateTenderNoticeDto) {
    return this.tenderBoardService.create(userId, dto);
  }

  @Patch('tender-notices/:id')
  @ApiOperation({ summary: 'Edit a notice; date changes flow to companies still preparing their bid' })
  updateNotice(@Param('id') id: string, @CurrentUser('id') userId: string, @Body() dto: UpdateTenderNoticeDto) {
    return this.tenderBoardService.update(userId, id, dto);
  }

  @Delete('tender-notices/:id')
  @ApiOperation({ summary: 'Remove a notice from the board (companies keep their tracked copies)' })
  removeNotice(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.tenderBoardService.remove(userId, id);
  }
}
