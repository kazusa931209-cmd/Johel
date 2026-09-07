-- Phase 35: nest experiences under workflow companies; add required period on company entries.

PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS "workflowExperiences";

CREATE TABLE "new_workflowCompanies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflowCompanies_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflowCompanies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

DROP TABLE "workflowCompanies";
ALTER TABLE "new_workflowCompanies" RENAME TO "workflowCompanies";

CREATE UNIQUE INDEX "workflowCompanies_workflowId_companyId_key" ON "workflowCompanies"("workflowId", "companyId");
CREATE INDEX "workflowCompanies_workflowId_idx" ON "workflowCompanies"("workflowId");
CREATE INDEX "workflowCompanies_companyId_idx" ON "workflowCompanies"("companyId");

CREATE TABLE "workflowCompanyExperiences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowCompanyId" TEXT NOT NULL,
    "experienceId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflowCompanyExperiences_workflowCompanyId_fkey" FOREIGN KEY ("workflowCompanyId") REFERENCES "workflowCompanies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflowCompanyExperiences_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "experiences" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "workflowCompanyExperiences_workflowCompanyId_experienceId_key" ON "workflowCompanyExperiences"("workflowCompanyId", "experienceId");
CREATE INDEX "workflowCompanyExperiences_workflowCompanyId_idx" ON "workflowCompanyExperiences"("workflowCompanyId");
CREATE INDEX "workflowCompanyExperiences_experienceId_idx" ON "workflowCompanyExperiences"("experienceId");

PRAGMA foreign_keys=ON;
