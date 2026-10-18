import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TendersService } from './tenders.service';
import {
  CreateTenderNoticeDto,
  UpdateTenderNoticeDto,
} from './dto/tender-notice.dto';

/** Tender stages where the company is still preparing, so notice date changes are copied in */
const PRE_SUBMISSION = ['Identified', 'Preparing'];
const DATE_FIELDS = [
  'siteVisitDate',
  'clarificationDeadline',
  'submissionDeadline',
  'openingDate',
] as const;

const toDate = (v: string | null | undefined) =>
  v === undefined ? undefined : v ? new Date(v) : null;
const text = (v: string | null | undefined) =>
  v === undefined ? undefined : v?.trim() || null;

/**
 * The shared Le’Kiray Tender Board.
 * - Notices are platform-wide: every company reads them; only platform admins write them.
 * - A company "tracks" a notice, which copies its public facts into the company's own private Tender.
 *   Nothing a company does with its copy (bid amount, documents, outcome) is visible to others.
 */
@Injectable()
export class TenderBoardService {
  constructor(
    private prisma: PrismaService,
    private tendersService: TendersService,
  ) {}

  // ── Company side ───────────────────────────────────────────────

  async listForCompany(
    companyId: string,
    query?: { search?: string; category?: string },
  ) {
    const where: Prisma.TenderNoticeWhereInput = {
      deletedAt: null,
      status: 'Open',
      submissionDeadline: { gte: new Date() },
    };
    if (query?.category && query.category !== 'ALL')
      where.category = query.category;
    if (query?.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { tenderNumber: { contains: s, mode: 'insensitive' } },
        { procuringEntity: { contains: s, mode: 'insensitive' } },
        { regionOrCity: { contains: s, mode: 'insensitive' } },
      ];
    }

    const notices = await this.prisma.tenderNotice.findMany({
      where,
      orderBy: { submissionDeadline: 'asc' },
      include: {
        // Only the caller's own tracked copy — never other companies'
        trackedBy: {
          where: { companyId, deletedAt: null },
          select: { id: true, status: true },
        },
      },
    });
    return notices.map(
      ({ trackedBy, createdById, updatedById, deletedAt, ...n }) => ({
        ...n,
        trackedTender: trackedBy[0] ?? null,
      }),
    );
  }

  async track(noticeId: string, companyId: string, userId: string) {
    const notice = await this.prisma.tenderNotice.findFirst({
      where: { id: noticeId, deletedAt: null },
    });
    if (!notice) throw new NotFoundException('Tender notice not found');
    if (notice.status !== 'Open')
      throw new BadRequestException(
        'This tender has been cancelled by the client',
      );
    if (notice.submissionDeadline < new Date())
      throw new BadRequestException(
        'The submission deadline for this tender has passed',
      );

    const existing = await this.prisma.tender.findFirst({
      where: { companyId, noticeId, deletedAt: null },
    });
    if (existing)
      throw new ConflictException({
        message: 'Your company is already tracking this tender',
        tenderId: existing.id,
      });

    try {
      return await this.tendersService.create(
        companyId,
        userId,
        {
          tenderNumber: notice.tenderNumber,
          title: notice.title,
          procuringEntity: notice.procuringEntity,
          category: notice.category,
          procurementMethod: notice.procurementMethod,
          source: 'Le’Kiray Marketplace',
          requiredGrade: notice.requiredGrade ?? undefined,
          location: notice.location ?? undefined,
          regionOrCity: notice.regionOrCity ?? undefined,
          description: notice.description ?? undefined,
          estimatedValue: notice.estimatedValue ?? undefined,
          documentFee: notice.documentFee ?? undefined,
          bidSecurityAmount: notice.bidSecurityAmount ?? undefined,
          bidSecurityType: notice.bidSecurityType ?? undefined,
          publishedDate: notice.publishedDate?.toISOString(),
          siteVisitDate: notice.siteVisitDate?.toISOString(),
          clarificationDeadline: notice.clarificationDeadline?.toISOString(),
          submissionDeadline: notice.submissionDeadline.toISOString(),
          openingDate: notice.openingDate?.toISOString(),
          bidManagerId: userId,
        },
        { noticeId },
      );
    } catch (err) {
      // A soft-deleted copy, or a double click racing the check above
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'Your company is already tracking this tender',
        );
      }
      throw err;
    }
  }

  // ── Platform side (called only from PlatformController) ────────

  async listAll() {
    const notices = await this.prisma.tenderNotice.findMany({
      where: { deletedAt: null },
      orderBy: { submissionDeadline: 'desc' },
      include: {
        _count: { select: { trackedBy: { where: { deletedAt: null } } } },
      },
    });
    return notices.map(({ _count, ...n }) => ({
      ...n,
      trackedCount: _count.trackedBy,
    }));
  }

  async create(userId: string, dto: CreateTenderNoticeDto) {
    return this.prisma.tenderNotice.create({
      data: {
        tenderNumber: dto.tenderNumber.trim(),
        title: dto.title.trim(),
        procuringEntity: dto.procuringEntity.trim(),
        category: dto.category,
        procurementMethod: dto.procurementMethod ?? 'Open National Bidding',
        source: text(dto.source),
        sourceUrl: text(dto.sourceUrl),
        requiredGrade: text(dto.requiredGrade),
        location: text(dto.location),
        regionOrCity: text(dto.regionOrCity),
        description: text(dto.description),
        estimatedValue: dto.estimatedValue ?? null,
        documentFee: dto.documentFee ?? null,
        bidSecurityAmount: dto.bidSecurityAmount ?? null,
        bidSecurityType: dto.bidSecurityType ?? null,
        publishedDate: toDate(dto.publishedDate),
        siteVisitDate: toDate(dto.siteVisitDate),
        clarificationDeadline: toDate(dto.clarificationDeadline),
        submissionDeadline: new Date(dto.submissionDeadline),
        openingDate: toDate(dto.openingDate),
        createdById: userId,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateTenderNoticeDto) {
    const notice = await this.getNotice(id);

    // Notice change, date copies and activity notes land together or not at all
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.tenderNotice.update({
        where: { id },
        data: {
          tenderNumber: dto.tenderNumber?.trim(),
          title: dto.title?.trim(),
          procuringEntity: dto.procuringEntity?.trim(),
          category: dto.category,
          procurementMethod: dto.procurementMethod,
          source: text(dto.source),
          sourceUrl: text(dto.sourceUrl),
          requiredGrade: text(dto.requiredGrade),
          location: text(dto.location),
          regionOrCity: text(dto.regionOrCity),
          description: text(dto.description),
          estimatedValue: dto.estimatedValue,
          documentFee: dto.documentFee,
          bidSecurityAmount: dto.bidSecurityAmount,
          bidSecurityType: dto.bidSecurityType,
          publishedDate: toDate(dto.publishedDate),
          siteVisitDate: toDate(dto.siteVisitDate),
          clarificationDeadline: toDate(dto.clarificationDeadline),
          submissionDeadline: dto.submissionDeadline
            ? new Date(dto.submissionDeadline)
            : undefined,
          openingDate: toDate(dto.openingDate),
          status: dto.status,
          updatedById: userId,
        },
      });

      // Copy changed key dates (an addendum or extension) into companies' tracked copies still in preparation
      const changedDates = DATE_FIELDS.filter(
        (f) =>
          dto[f] !== undefined &&
          notice[f]?.getTime() !== updated[f]?.getTime(),
      );
      const messages: string[] = [];
      if (changedDates.length) {
        messages.push(
          `Le’Kiray updated the tender notice: ${changedDates
            .map(
              (f) =>
                `${f.replace(/([A-Z])/g, ' $1').toLowerCase()} ${updated[f] ? `changed to ${updated[f]!.toISOString().slice(0, 16).replace('T', ' ')} UTC` : 'removed'}`,
            )
            .join('; ')}`,
        );
      }
      if (dto.status === 'Cancelled' && notice.status !== 'Cancelled') {
        messages.push(
          'Le’Kiray reports this tender was cancelled by the client',
        );
      }

      if (messages.length) {
        const tracked = await tx.tender.findMany({
          where: { noticeId: id, deletedAt: null },
          select: { id: true, companyId: true, status: true },
        });
        const toUpdate = tracked
          .filter((t) => PRE_SUBMISSION.includes(t.status))
          .map((t) => t.id);
        if (changedDates.length && toUpdate.length) {
          await tx.tender.updateMany({
            where: { id: { in: toUpdate } },
            data: Object.fromEntries(changedDates.map((f) => [f, updated[f]])),
          });
        }
        if (tracked.length) {
          await tx.auditLog.createMany({
            data: tracked.map((t) => ({
              companyId: t.companyId,
              userId,
              action: 'TENDER_NOTICE_UPDATED',
              details: JSON.stringify({
                tenderId: t.id,
                message:
                  messages.join('. ') +
                  (changedDates.length && !toUpdate.includes(t.id)
                    ? ' (your copy was not changed because it is already submitted)'
                    : ''),
              }),
            })),
          });
        }
      }

      return updated;
    });
  }

  async remove(userId: string, id: string) {
    await this.getNotice(id);
    await this.prisma.tenderNotice.update({
      where: { id },
      data: { deletedAt: new Date(), updatedById: userId },
    });
    return { success: true };
  }

  private async getNotice(id: string) {
    const notice = await this.prisma.tenderNotice.findFirst({
      where: { id, deletedAt: null },
    });
    if (!notice) throw new NotFoundException('Tender notice not found');
    return notice;
  }
}
