-- Replace status with finalized boolean (true when user downloaded resume DOCX).
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_generations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "inputToken" INTEGER NOT NULL DEFAULT 0,
    "outputToken" INTEGER NOT NULL DEFAULT 0,
    "activeStep" TEXT NOT NULL,
    "jobJson" TEXT NOT NULL,
    "combineJson" TEXT NOT NULL,
    "verdictMarkdown" TEXT,
    "resumeJson" TEXT,
    "evaluationMarkdown" TEXT,
    "doVerdict" BOOLEAN NOT NULL,
    "doEvaluate" BOOLEAN NOT NULL,
    "resumeLanguage" TEXT NOT NULL,
    "verdictPrompt" TEXT NOT NULL,
    "generatePrompt" TEXT NOT NULL,
    "evaluatePrompt" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "generations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_generations" (
    "id",
    "publicId",
    "userId",
    "finalized",
    "inputToken",
    "outputToken",
    "activeStep",
    "jobJson",
    "combineJson",
    "verdictMarkdown",
    "resumeJson",
    "evaluationMarkdown",
    "doVerdict",
    "doEvaluate",
    "resumeLanguage",
    "verdictPrompt",
    "generatePrompt",
    "evaluatePrompt",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "publicId",
    "userId",
    CASE WHEN "status" = 'finalized' THEN 1 ELSE 0 END,
    "inputToken",
    "outputToken",
    "activeStep",
    "jobJson",
    "combineJson",
    "verdictMarkdown",
    "resumeJson",
    "evaluationMarkdown",
    "doVerdict",
    "doEvaluate",
    "resumeLanguage",
    "verdictPrompt",
    "generatePrompt",
    "evaluatePrompt",
    "createdAt",
    "updatedAt"
FROM "generations";
DROP TABLE "generations";
ALTER TABLE "new_generations" RENAME TO "generations";
CREATE UNIQUE INDEX "generations_userId_publicId_key" ON "generations"("userId", "publicId");
CREATE INDEX "generations_userId_createdAt_idx" ON "generations"("userId", "createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
