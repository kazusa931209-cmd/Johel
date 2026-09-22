-- AlterTable
ALTER TABLE "generations" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'jdResume';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "currentGeneralGenerationId" TEXT;
