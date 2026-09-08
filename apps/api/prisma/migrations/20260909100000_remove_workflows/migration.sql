-- Remove workflow tables and generation-process workflow fields.

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_generationProcess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "doVerdict" BOOLEAN NOT NULL DEFAULT true,
    "doEvaluate" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "generationProcess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_generationProcess" ("id", "userId", "doVerdict", "doEvaluate", "createdAt", "updatedAt")
SELECT "id", "userId", "doVerdict", "doEvaluate", "createdAt", "updatedAt" FROM "generationProcess";

DROP TABLE "generationProcess";
ALTER TABLE "new_generationProcess" RENAME TO "generationProcess";

CREATE UNIQUE INDEX "generationProcess_userId_key" ON "generationProcess"("userId");

DROP TABLE IF EXISTS "workflowCompanyExperiences";
DROP TABLE IF EXISTS "workflowCompanies";
DROP TABLE IF EXISTS "workflows";

PRAGMA foreign_keys=ON;
