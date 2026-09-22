-- CreateTable
CREATE TABLE "generations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_aiUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "generationId" TEXT,
    "aiProvider" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "generateType" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "inputToken" INTEGER NOT NULL,
    "outputToken" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "aiUsage_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_aiUsage" ("id", "userId", "aiProvider", "modelName", "generateType", "input", "output", "inputToken", "outputToken", "createdAt") SELECT "id", "userId", "aiProvider", "modelName", "generateType", "input", "output", "inputToken", "outputToken", "createdAt" FROM "aiUsage";
DROP TABLE "aiUsage";
ALTER TABLE "new_aiUsage" RENAME TO "aiUsage";
CREATE INDEX "aiUsage_userId_idx" ON "aiUsage"("userId");
CREATE INDEX "aiUsage_userId_createdAt_idx" ON "aiUsage"("userId", "createdAt");
CREATE INDEX "aiUsage_generationId_idx" ON "aiUsage"("generationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "generations_userId_publicId_key" ON "generations"("userId", "publicId");
CREATE INDEX "generations_userId_createdAt_idx" ON "generations"("userId", "createdAt");
