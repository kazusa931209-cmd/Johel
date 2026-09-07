-- Phase 36: remove prompt optimization; add workflow recommendation settings.

PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS "promptOptimizations";

CREATE TABLE "new_generationProcess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "doVerdict" BOOLEAN NOT NULL DEFAULT true,
    "doEvaluate" BOOLEAN NOT NULL DEFAULT true,
    "doWorkflowRecommendation" BOOLEAN NOT NULL DEFAULT false,
    "workflowRecommendationThreshold" INTEGER NOT NULL DEFAULT 70,
    "lastSelectedWorkflowId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "generationProcess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "generationProcess_lastSelectedWorkflowId_fkey" FOREIGN KEY ("lastSelectedWorkflowId") REFERENCES "workflows" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_generationProcess" ("id", "userId", "doVerdict", "doEvaluate", "createdAt", "updatedAt")
SELECT "id", "userId", "doVerdict", "doEvaluate", "createdAt", "updatedAt"
FROM "generationProcess";

DROP TABLE "generationProcess";
ALTER TABLE "new_generationProcess" RENAME TO "generationProcess";

CREATE UNIQUE INDEX "generationProcess_userId_key" ON "generationProcess"("userId");
CREATE INDEX "generationProcess_lastSelectedWorkflowId_idx" ON "generationProcess"("lastSelectedWorkflowId");

PRAGMA foreign_keys=ON;
