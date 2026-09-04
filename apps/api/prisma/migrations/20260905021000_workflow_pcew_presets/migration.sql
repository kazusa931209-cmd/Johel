-- Redefine workflows as PCEW presets: drop metadata, add profile + junction tables.

PRAGMA foreign_keys=OFF;

CREATE TABLE "new_workflows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "profileId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflows_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_workflows" ("id", "userId", "name", "description", "language", "createdAt", "updatedAt")
SELECT "id", "userId", "name", "description", "language", "createdAt", "updatedAt"
FROM "workflows";

DROP TABLE "workflows";
ALTER TABLE "new_workflows" RENAME TO "workflows";

CREATE INDEX "workflows_userId_idx" ON "workflows"("userId");
CREATE INDEX "workflows_profileId_idx" ON "workflows"("profileId");

DROP TABLE IF EXISTS "workflowMetadata";

CREATE TABLE "workflowCompanies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflowCompanies_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflowCompanies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "workflowCompanies_workflowId_companyId_key" ON "workflowCompanies"("workflowId", "companyId");
CREATE INDEX "workflowCompanies_workflowId_idx" ON "workflowCompanies"("workflowId");
CREATE INDEX "workflowCompanies_companyId_idx" ON "workflowCompanies"("companyId");

CREATE TABLE "workflowExperiences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflowExperiences_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflowExperiences_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "experiences" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "workflowExperiences_workflowId_experienceId_key" ON "workflowExperiences"("workflowId", "experienceId");
CREATE INDEX "workflowExperiences_workflowId_idx" ON "workflowExperiences"("workflowId");
CREATE INDEX "workflowExperiences_experienceId_idx" ON "workflowExperiences"("experienceId");

PRAGMA foreign_keys=ON;
