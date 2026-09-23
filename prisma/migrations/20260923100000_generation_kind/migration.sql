-- AlterTable
ALTER TABLE "generations" ADD COLUMN "kind" TEXT NOT NULL DEFAULT 'jdResume';

-- AlterTable (currentGeneralGenerationId + user→generation FKs)
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "sessionVersion" INTEGER NOT NULL DEFAULT 0,
    "currentGenerationId" TEXT,
    "currentGeneralGenerationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_currentGenerationId_fkey" FOREIGN KEY ("currentGenerationId") REFERENCES "generations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "users_currentGeneralGenerationId_fkey" FOREIGN KEY ("currentGeneralGenerationId") REFERENCES "generations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "currentGeneralGenerationId", "currentGenerationId", "email", "id", "passwordHash", "role", "sessionVersion", "updatedAt") SELECT "createdAt", NULL, "currentGenerationId", "email", "id", "passwordHash", "role", "sessionVersion", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
