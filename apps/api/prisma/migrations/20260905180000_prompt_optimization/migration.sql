ALTER TABLE "generationProcess" ADD COLUMN "usePromptOptimizationAi" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "promptOptimizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "optimizedPrompt" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "promptOptimizations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "promptOptimizations_userId_kind_sourceHash_key" ON "promptOptimizations"("userId", "kind", "sourceHash");
CREATE INDEX "promptOptimizations_userId_kind_idx" ON "promptOptimizations"("userId", "kind");
