-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user';

-- AlterTable
ALTER TABLE "prompts" ADD COLUMN "verdictExtension" TEXT NOT NULL DEFAULT '';
ALTER TABLE "prompts" ADD COLUMN "generateExtension" TEXT NOT NULL DEFAULT '';
ALTER TABLE "prompts" ADD COLUMN "evaluateExtension" TEXT NOT NULL DEFAULT '';
