-- AlterTable
ALTER TABLE "tenders" ADD COLUMN     "noticeId" TEXT;

-- CreateTable
CREATE TABLE "tender_notices" (
    "id" TEXT NOT NULL,
    "tenderNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "procuringEntity" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "procurementMethod" TEXT NOT NULL DEFAULT 'Open National Bidding',
    "source" TEXT,
    "sourceUrl" TEXT,
    "requiredGrade" TEXT,
    "location" TEXT,
    "regionOrCity" TEXT,
    "description" TEXT,
    "estimatedValue" DOUBLE PRECISION,
    "documentFee" DOUBLE PRECISION,
    "bidSecurityAmount" DOUBLE PRECISION,
    "bidSecurityType" TEXT,
    "publishedDate" TIMESTAMP(3),
    "siteVisitDate" TIMESTAMP(3),
    "clarificationDeadline" TIMESTAMP(3),
    "submissionDeadline" TIMESTAMP(3) NOT NULL,
    "openingDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'Open',
    "createdById" TEXT,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "tender_notices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tender_notices_deletedAt_status_submissionDeadline_idx" ON "tender_notices"("deletedAt", "status", "submissionDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "tenders_companyId_noticeId_key" ON "tenders"("companyId", "noticeId");

-- AddForeignKey
ALTER TABLE "tenders" ADD CONSTRAINT "tenders_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "tender_notices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

