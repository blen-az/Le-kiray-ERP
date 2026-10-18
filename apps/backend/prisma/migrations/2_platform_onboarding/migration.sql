-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "city" TEXT,
ADD COLUMN     "licenseGrade" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Active',
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "tinNumber" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

