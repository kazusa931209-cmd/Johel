-- Backfill null workflow descriptions before making the column required.
UPDATE "workflows" SET "description" = '' WHERE "description" IS NULL;

-- RedefineTable
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_workflows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "profileId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT 'en',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workflows_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_workflows" ("id", "userId", "profileId", "name", "description", "language", "createdAt", "updatedAt")
SELECT "id", "userId", "profileId", "name", COALESCE("description", ''), "language", "createdAt", "updatedAt" FROM "workflows";
DROP TABLE "workflows";
ALTER TABLE "new_workflows" RENAME TO "workflows";
CREATE INDEX "workflows_userId_idx" ON "workflows"("userId");
CREATE INDEX "workflows_profileId_idx" ON "workflows"("profileId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
