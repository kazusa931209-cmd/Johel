-- AlterTable
ALTER TABLE "experiences" ADD COLUMN "deletedAt" DATETIME;

-- CreateIndex
CREATE INDEX "experiences_userId_deletedAt_idx" ON "experiences"("userId", "deletedAt");
