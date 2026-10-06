-- AlterTable
ALTER TABLE "prompts" ADD COLUMN "refinePrompt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "prompts" ADD COLUMN "refineExtension" TEXT NOT NULL DEFAULT '';
