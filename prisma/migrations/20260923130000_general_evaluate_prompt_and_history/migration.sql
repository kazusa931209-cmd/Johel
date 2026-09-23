-- AlterTable
ALTER TABLE "prompts" ADD COLUMN "generalEvaluatePrompt" TEXT NOT NULL DEFAULT '';
ALTER TABLE "prompts" ADD COLUMN "generalEvaluateExtension" TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE "generations" ADD COLUMN "evaluationHistoryJson" TEXT;
