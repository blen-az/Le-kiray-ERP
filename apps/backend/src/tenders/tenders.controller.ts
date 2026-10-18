import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TendersService } from './tenders.service';
import { TenderBoardService } from './tender-board.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permissions } from '../auth/permissions.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/current-user.decorator';
import { CreateTenderDto } from './dto/create-tender.dto';
import { UpdateTenderDto } from './dto/update-tender.dto';
import {
  ChangeTenderStatusDto,
  ConvertTenderToProjectDto,
  CreateTenderChecklistItemDto,
  RecordTenderOutcomeDto,
  UpdateTenderChecklistItemDto,
} from './dto/tender-actions.dto';

@ApiTags('Tenders & Bids')
@Controller('tenders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TendersController {
  constructor(
    private readonly tendersService: TendersService,
    private readonly tenderBoardService: TenderBoardService,
  ) {}

  @Get()
  @Permissions('tenders:view')
  @ApiOperation({ summary: 'List tenders with search, status (or OPEN), category, and bid manager filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'bidManagerId', required: false })
  findAll(
    @CurrentUser('companyId') companyId: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('bidManagerId') bidManagerId?: string,
  ) {
    return this.tendersService.findAll(companyId, { search, status, category, bidManagerId });
  }

  @Get('summary')
  @Permissions('tenders:view')
  @ApiOperation({ summary: 'Pipeline value, win rate, upcoming deadlines, and outstanding bid securities' })
  getSummary(@CurrentUser('companyId') companyId: string) {
    return this.tendersService.getSummary(companyId);
  }

  @Get('users/bid-managers')
  @Permissions('tenders:view')
  @ApiOperation({ summary: 'List company users who can be assigned as bid managers' })
  listBidManagers(@CurrentUser('companyId') companyId: string) {
    return this.tendersService.listBidManagers(companyId);
  }

  // Shared Le’Kiray Tender Board — declared before ':id' so 'board' is not read as a tender id
  @Get('board')
  @Permissions('tenders:view')
  @ApiOperation({ summary: 'Open tender notices published by Le’Kiray, with your company tracking status' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  listBoard(
    @CurrentUser('companyId') companyId: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    return this.tenderBoardService.listForCompany(companyId, { search, category });
  }

  @Post('board/:noticeId/track')
  @Permissions('tenders:create')
  @ApiOperation({ summary: 'Copy a Tender Board notice into your company’s private pipeline' })
  track(@Param('noticeId') noticeId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tenderBoardService.track(noticeId, user.companyId, user.id);
  }

  @Post()
  @Permissions('tenders:create')
  @ApiOperation({ summary: 'Register a new tender with a default bid-document checklist' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTenderDto) {
    return this.tendersService.create(user.companyId, user.id, dto);
  }

  @Get(':id')
  @Permissions('tenders:view')
  @ApiOperation({ summary: 'Get tender details with checklist and activity history' })
  findOne(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.tendersService.findOne(id, companyId);
  }

  @Patch(':id')
  @Permissions('tenders:update')
  @ApiOperation({ summary: 'Update tender details, bid amount, or dates' })
  update(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateTenderDto) {
    return this.tendersService.update(id, user.companyId, user.id, dto);
  }

  @Delete(':id')
  @Permissions('tenders:delete')
  @ApiOperation({ summary: 'Soft delete a tender' })
  delete(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.tendersService.delete(id, user.companyId, user.id);
  }

  @Post(':id/status')
  @Permissions('tenders:update')
  @ApiOperation({ summary: 'Move a tender through the bid pipeline (Preparing, Submitted, No Bid, ...)' })
  changeStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangeTenderStatusDto,
  ) {
    return this.tendersService.changeStatus(id, user.companyId, user.id, dto);
  }

  @Post(':id/outcome')
  @Permissions('tenders:award')
  @ApiOperation({ summary: 'Record a submitted tender as Won or Lost' })
  recordOutcome(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RecordTenderOutcomeDto,
  ) {
    return this.tendersService.recordOutcome(id, user.companyId, user.id, dto);
  }

  @Post(':id/convert')
  @Permissions('tenders:award', 'projects:create')
  @ApiOperation({ summary: 'Create a project from a won tender' })
  convertToProject(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConvertTenderToProjectDto,
  ) {
    return this.tendersService.convertToProject(id, user.companyId, user.id, dto);
  }

  @Post(':id/checklist')
  @Permissions('tenders:update')
  @ApiOperation({ summary: 'Add a bid-document checklist item' })
  addChecklistItem(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: CreateTenderChecklistItemDto,
  ) {
    return this.tendersService.addChecklistItem(id, companyId, dto);
  }

  @Patch(':id/checklist/:itemId')
  @Permissions('tenders:update')
  @ApiOperation({ summary: 'Tick off or rename a checklist item' })
  updateChecklistItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser('companyId') companyId: string,
    @Body() dto: UpdateTenderChecklistItemDto,
  ) {
    return this.tendersService.updateChecklistItem(id, itemId, companyId, dto);
  }

  @Delete(':id/checklist/:itemId')
  @Permissions('tenders:update')
  @ApiOperation({ summary: 'Remove a checklist item' })
  removeChecklistItem(
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.tendersService.removeChecklistItem(id, itemId, companyId);
  }
}
