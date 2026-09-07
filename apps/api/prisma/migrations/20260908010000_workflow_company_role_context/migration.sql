-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_workflowCompanies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "roleContext" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflowCompanies_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflowCompanies_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_workflowCompanies" ("id", "workflowId", "companyId", "startDate", "endDate", "roleContext", "sortOrder", "createdAt", "updatedAt")
SELECT "id", "workflowId", "companyId", "startDate", "endDate", '', "sortOrder", "createdAt", "updatedAt" FROM "workflowCompanies";
DROP TABLE "workflowCompanies";
ALTER TABLE "new_workflowCompanies" RENAME TO "workflowCompanies";
CREATE UNIQUE INDEX "workflowCompanies_workflowId_companyId_key" ON "workflowCompanies"("workflowId", "companyId");
CREATE INDEX "workflowCompanies_workflowId_idx" ON "workflowCompanies"("workflowId");
CREATE INDEX "workflowCompanies_companyId_idx" ON "workflowCompanies"("companyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
