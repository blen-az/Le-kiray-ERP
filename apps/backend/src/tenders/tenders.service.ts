import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenderDto, DEFAULT_TENDER_CHECKLIST } from './dto/create-tender.dto';
import { UpdateTenderDto } from './dto/update-tender.dto';
import {
  ChangeTenderStatusDto,
  ConvertTenderToProjectDto,
  CreateTenderChecklistItemDto,
  RecordTenderOutcomeDto,
  UpdateTenderChecklistItemDto,
} from './dto/tender-actions.dto';

/** Stages where the bid is still being pursued */
const OPEN_STATUSES = ['Identified', 'Preparing', 'Submitted', 'Under Evaluation'];
/** Stages where we have not yet handed in the bid */
const PRE_SUBMISSION_STATUSES = ['Identified', 'Preparing'];
/** Stages after which our bid security is held by the procuring entity */
const SECURITY_HELD_STATUSES = ['Submitted', 'Under Evaluation', 'Won', 'Lost'];

/** Allowed pipeline moves (Won/Lost are recorded through recordOutcome) */
const STATUS_TRANSITIONS: Record<string, string[]> = {
  Identified: ['Preparing', 'No Bid', 'Cancelled'],
  Preparing: ['Identified', 'Submitted', 'No Bid', 'Cancelled'],
  Submitted: ['Under Evaluation', 'Cancelled'],
  'Under Evaluation': ['Submitted', 'Cancelled'],
  'No Bid': ['Identified'],
  Cancelled: [],
  Won: [],
  Lost: [],
};

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class TendersService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    companyId: string,
    query?: { search?: string; status?: string; category?: string; bidManagerId?: string },
  ) {
    const where: any = { companyId, deletedAt: null };

    if (query?.status && query.status !== 'ALL') {
      where.status = query.status === 'OPEN' ? { in: OPEN_STATUSES } : query.status;
    }
    if (query?.category && query.category !== 'ALL') {
      where.category = query.category;
    }
    if (query?.bidManagerId && query.bidManagerId !== 'ALL') {
      where.bidManagerId = query.bidManagerId;
    }
    if (query?.search) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { tenderNumber: { contains: s, mode: 'insensitive' } },
        { procuringEntity: { contains: s, mode: 'insensitive' } },
        { location: { contains: s, mode: 'insensitive' } },
        { regionOrCity: { contains: s, mode: 'insensitive' } },
      ];
    }

    const tenders = await this.prisma.tender.findMany({
      where,
      include: {
        bidManager: { select: { id: true, firstName: true, lastName: true } },
        convertedProject: { select: { id: true, projectName: true } },
        checklist: { select: { isDone: true } },
      },
      orderBy: { submissionDeadline: 'asc' },
    });

    return tenders.map(({ checklist, ...t }) => ({
      ...t,
      checklistTotal: checklist.length,
      checklistDone: checklist.filter((c) => c.isDone).length,
    }));
  }

  async getSummary(companyId: string) {
    const tenders = await this.prisma.tender.findMany({
      where: { companyId, deletedAt: null },
      select: {
        status: true,
        estimatedValue: true,
        bidAmount: true,
        awardedAmount: true,
        winProbability: true,
        bidSecurityAmount: true,
        bidSecurityReturned: true,
        submissionDeadline: true,
      },
    });

    const now = Date.now();
    const byStatus: Record<string, number> = {};
    let openPipelineValue = 0;
    let weightedPipelineValue = 0;
    let wonValue = 0;
    let wonCount = 0;
    let lostCount = 0;
    let dueThisWeek = 0;
    let overdue = 0;
    let bidSecurityOutstanding = 0;

    for (const t of tenders) {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      const value = t.bidAmount ?? t.estimatedValue;

      if (OPEN_STATUSES.includes(t.status)) {
        openPipelineValue += value;
        weightedPipelineValue += (value * t.winProbability) / 100;
      }
      if (t.status === 'Won') {
        wonCount++;
        wonValue += t.awardedAmount ?? value;
      }
      if (t.status === 'Lost') lostCount++;

      if (PRE_SUBMISSION_STATUSES.includes(t.status)) {
        const deadline = t.submissionDeadline.getTime();
        if (deadline < now) overdue++;
        else if (deadline - now <= 7 * DAY_MS) dueThisWeek++;
      }

      if (SECURITY_HELD_STATUSES.includes(t.status) && !t.bidSecurityReturned) {
        bidSecurityOutstanding += t.bidSecurityAmount;
      }
    }

    const decided = wonCount + lostCount;

    return {
      totalTenders: tenders.length,
      openCount: tenders.filter((t) => OPEN_STATUSES.includes(t.status)).length,
      byStatus,
      openPipelineValue,
      weightedPipelineValue,
      wonCount,
      lostCount,
      wonValue,
      winRate: decided > 0 ? Math.round((wonCount / decided) * 100) : null,
      dueThisWeek,
      overdue,
      bidSecurityOutstanding,
    };
  }

  listBidManagers(companyId: string) {
    return this.prisma.user.findMany({
      where: { companyId, deletedAt: null },
      select: { id: true, firstName: true, lastName: true, email: true },
      orderBy: { firstName: 'asc' },
    });
  }

  async findOne(id: string, companyId: string) {
    const tender = await this.prisma.tender.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        bidManager: { select: { id: true, firstName: true, lastName: true, email: true } },
        convertedProject: { select: { id: true, projectName: true, status: true } },
        checklist: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    });

    if (!tender) {
      throw new NotFoundException(`Tender with ID "${id}" not found`);
    }

    const activity = await this.prisma.auditLog.findMany({
      where: { companyId, action: { startsWith: 'TENDER_' }, details: { contains: id } },
      include: { user: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });

    return {
      ...tender,
      activity: activity.map((a) => {
        let message = a.details;
        try {
          message = JSON.parse(a.details).message ?? a.details;
        } catch {
          // legacy plain-text details
        }
        return {
          id: a.id,
          action: a.action,
          message,
          createdAt: a.createdAt,
          user: a.user ? `${a.user.firstName} ${a.user.lastName}` : null,
        };
      }),
    };
  }

  async create(companyId: string, userId: string, dto: CreateTenderDto) {
    if (dto.bidManagerId) {
      await this.assertUserInCompany(dto.bidManagerId, companyId);
    }

    const checklistLabels = (dto.checklist?.length ? dto.checklist : DEFAULT_TENDER_CHECKLIST).map((l) =>
      l.trim(),
    );

    const tender = await this.prisma.tender.create({
      data: {
        companyId,
        tenderNumber: dto.tenderNumber.trim(),
        title: dto.title.trim(),
        procuringEntity: dto.procuringEntity.trim(),
        category: dto.category,
        procurementMethod: dto.procurementMethod ?? 'Open National Bidding',
        source: dto.source ?? null,
        requiredGrade: dto.requiredGrade ?? null,
        location: dto.location ?? null,
        regionOrCity: dto.regionOrCity ?? null,
        description: dto.description ?? null,
        winProbability: dto.winProbability ?? 50,
        estimatedValue: dto.estimatedValue ?? 0,
        bidAmount: dto.bidAmount ?? null,
        documentFee: dto.documentFee ?? 0,
        bidSecurityAmount: dto.bidSecurityAmount ?? 0,
        bidSecurityType: dto.bidSecurityType ?? null,
        publishedDate: dto.publishedDate ? new Date(dto.publishedDate) : null,
        siteVisitDate: dto.siteVisitDate ? new Date(dto.siteVisitDate) : null,
        clarificationDeadline: dto.clarificationDeadline ? new Date(dto.clarificationDeadline) : null,
        submissionDeadline: new Date(dto.submissionDeadline),
        openingDate: dto.openingDate ? new Date(dto.openingDate) : null,
        bidManagerId: dto.bidManagerId ?? null,
        createdById: userId,
        checklist: {
          create: checklistLabels.map((label, index) => ({ companyId, label, sortOrder: index })),
        },
      },
    });

    await this.log(companyId, userId, 'TENDER_CREATED', tender.id, `Tender ${tender.tenderNumber} registered`);

    return this.findOne(tender.id, companyId);
  }

  async update(id: string, companyId: string, userId: string, dto: UpdateTenderDto) {
    const existing = await this.getTender(id, companyId);

    if (dto.bidManagerId) {
      await this.assertUserInCompany(dto.bidManagerId, companyId);
    }

    const toDate = (v: string | undefined) => (v === undefined ? undefined : v ? new Date(v) : null);

    await this.prisma.tender.update({
      where: { id: existing.id },
      data: {
        ...dto,
        tenderNumber: dto.tenderNumber?.trim(),
        title: dto.title?.trim(),
        procuringEntity: dto.procuringEntity?.trim(),
        publishedDate: toDate(dto.publishedDate),
        siteVisitDate: toDate(dto.siteVisitDate),
        clarificationDeadline: toDate(dto.clarificationDeadline),
        submissionDeadline: dto.submissionDeadline ? new Date(dto.submissionDeadline) : undefined,
        openingDate: toDate(dto.openingDate),
        updatedById: userId,
      },
    });

    if (dto.bidSecurityReturned && !existing.bidSecurityReturned) {
      await this.log(companyId, userId, 'TENDER_SECURITY_RETURNED', id, 'Bid security returned');
    }

    return this.findOne(id, companyId);
  }

  async delete(id: string, companyId: string, userId: string) {
    const existing = await this.getTender(id, companyId);
    await this.prisma.tender.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    await this.log(companyId, userId, 'TENDER_DELETED', id, `Tender ${existing.tenderNumber} deleted`);
    return { success: true };
  }

  async changeStatus(id: string, companyId: string, userId: string, dto: ChangeTenderStatusDto) {
    const tender = await this.getTender(id, companyId);
    const allowed = STATUS_TRANSITIONS[tender.status] ?? [];

    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot move a tender from "${tender.status}" to "${dto.status}".` +
          (allowed.length ? ` Allowed: ${allowed.join(', ')}.` : ' This tender is closed.'),
      );
    }

    if (dto.status === 'Submitted' && tender.status === 'Preparing' && !tender.bidAmount) {
      throw new BadRequestException('Enter the bid amount before marking the tender as submitted.');
    }

    const data: any = { status: dto.status, updatedById: userId };
    if (dto.status === 'Submitted' && !tender.submittedAt) data.submittedAt = new Date();
    if (dto.status === 'No Bid' || dto.status === 'Cancelled') {
      data.decidedAt = new Date();
      if (dto.notes) data.outcomeNotes = dto.notes;
    }
    if (dto.status === 'Identified') data.decidedAt = null;

    await this.prisma.tender.update({ where: { id }, data });
    await this.log(
      companyId,
      userId,
      'TENDER_STATUS_CHANGED',
      id,
      `Moved from ${tender.status} to ${dto.status}${dto.notes ? ` — ${dto.notes}` : ''}`,
    );

    return this.findOne(id, companyId);
  }

  async recordOutcome(id: string, companyId: string, userId: string, dto: RecordTenderOutcomeDto) {
    const tender = await this.getTender(id, companyId);

    if (!['Submitted', 'Under Evaluation'].includes(tender.status)) {
      throw new BadRequestException('Only submitted tenders can be marked as won or lost.');
    }

    const awardedAmount =
      dto.awardedAmount ?? (dto.outcome === 'Won' ? (tender.bidAmount ?? undefined) : undefined);

    await this.prisma.tender.update({
      where: { id },
      data: {
        status: dto.outcome,
        decidedAt: new Date(),
        awardedTo: dto.outcome === 'Lost' ? (dto.awardedTo ?? null) : null,
        awardedAmount: awardedAmount ?? null,
        outcomeNotes: dto.outcomeNotes ?? null,
        winProbability: dto.outcome === 'Won' ? 100 : 0,
        updatedById: userId,
      },
    });

    const message =
      dto.outcome === 'Won'
        ? `Tender WON${awardedAmount ? ` — awarded ETB ${awardedAmount.toLocaleString('en-US')}` : ''}`
        : `Tender lost${dto.awardedTo ? ` to ${dto.awardedTo}` : ''}`;
    await this.log(companyId, userId, 'TENDER_OUTCOME', id, message);

    return this.findOne(id, companyId);
  }

  async convertToProject(id: string, companyId: string, userId: string, dto: ConvertTenderToProjectDto) {
    const tender = await this.getTender(id, companyId);

    if (tender.status !== 'Won') {
      throw new BadRequestException('Only won tenders can be converted into projects.');
    }
    if (tender.convertedProjectId) {
      throw new BadRequestException('This tender has already been converted into a project.');
    }

    const projectManagerId = dto.projectManagerId ?? tender.bidManagerId ?? null;
    if (projectManagerId) {
      await this.assertUserInCompany(projectManagerId, companyId);
    }

    const project = await this.prisma.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          companyId,
          projectName: tender.title,
          projectCode: dto.projectCode ?? tender.tenderNumber,
          clientName: tender.procuringEntity,
          location: tender.location ?? tender.regionOrCity ?? 'To be confirmed',
          regionOrCity: tender.regionOrCity,
          status: 'Planning',
          budget: tender.awardedAmount ?? tender.bidAmount ?? tender.estimatedValue,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          projectManagerId,
          description: tender.description,
          createdById: userId,
        },
      });

      // Conditional update guards against two concurrent conversions creating duplicate projects
      const linked = await tx.tender.updateMany({
        where: { id, convertedProjectId: null },
        data: { convertedProjectId: created.id, updatedById: userId },
      });
      if (linked.count === 0) {
        throw new BadRequestException('This tender has already been converted into a project.');
      }

      return created;
    });

    await this.log(companyId, userId, 'TENDER_CONVERTED', id, `Converted to project "${project.projectName}"`);

    return { tenderId: id, project };
  }

  async addChecklistItem(id: string, companyId: string, dto: CreateTenderChecklistItemDto) {
    await this.getTender(id, companyId);
    const last = await this.prisma.tenderChecklistItem.findFirst({
      where: { tenderId: id, companyId },
      orderBy: { sortOrder: 'desc' },
    });

    return this.prisma.tenderChecklistItem.create({
      data: { companyId, tenderId: id, label: dto.label.trim(), sortOrder: (last?.sortOrder ?? -1) + 1 },
    });
  }

  async updateChecklistItem(id: string, itemId: string, companyId: string, dto: UpdateTenderChecklistItemDto) {
    const item = await this.getChecklistItem(id, itemId, companyId);

    return this.prisma.tenderChecklistItem.update({
      where: { id: item.id },
      data: {
        label: dto.label?.trim(),
        isDone: dto.isDone,
        completedAt: dto.isDone === undefined ? undefined : dto.isDone ? new Date() : null,
      },
    });
  }

  async removeChecklistItem(id: string, itemId: string, companyId: string) {
    const item = await this.getChecklistItem(id, itemId, companyId);
    await this.prisma.tenderChecklistItem.delete({ where: { id: item.id } });
    return { success: true };
  }

  private async getTender(id: string, companyId: string) {
    const tender = await this.prisma.tender.findFirst({ where: { id, companyId, deletedAt: null } });
    if (!tender) {
      throw new NotFoundException(`Tender with ID "${id}" not found`);
    }
    return tender;
  }

  private async getChecklistItem(tenderId: string, itemId: string, companyId: string) {
    await this.getTender(tenderId, companyId);
    const item = await this.prisma.tenderChecklistItem.findFirst({
      where: { id: itemId, tenderId, companyId },
    });
    if (!item) {
      throw new NotFoundException(`Checklist item with ID "${itemId}" not found`);
    }
    return item;
  }

  private async assertUserInCompany(userId: string, companyId: string) {
    const user = await this.prisma.user.findFirst({ where: { id: userId, companyId, deletedAt: null } });
    if (!user) {
      throw new BadRequestException('Selected user not found in this company workspace');
    }
  }

  private async log(companyId: string, userId: string, action: string, tenderId: string, message: string) {
    await this.prisma.auditLog.create({
      data: { companyId, userId, action, details: JSON.stringify({ tenderId, message }) },
    });
  }
}
