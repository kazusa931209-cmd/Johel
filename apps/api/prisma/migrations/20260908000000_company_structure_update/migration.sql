-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "whatCompanyIs" TEXT NOT NULL,
    "domainAndStack" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "companies_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_companies" ("id", "userId", "alias", "name", "whatCompanyIs", "domainAndStack", "createdAt", "updatedAt")
SELECT "id", "userId", "name", "name", "description", '', "createdAt", "updatedAt" FROM "companies";
DROP TABLE "companies";
ALTER TABLE "new_companies" RENAME TO "companies";
CREATE INDEX "companies_userId_idx" ON "companies"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
