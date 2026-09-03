-- Rename PascalCase tables to plural camelCase (SQLite is case-insensitive, so User≠users)
-- and move metadataJson into workflowMetadata.

PRAGMA foreign_keys=OFF;
PRAGMA defer_foreign_keys=ON;

ALTER TABLE "User" RENAME TO "users";
ALTER TABLE "Setting" RENAME TO "settings";
ALTER TABLE "Workflow" RENAME TO "workflows";

DROP INDEX IF EXISTS "User_email_key";
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

DROP INDEX IF EXISTS "Setting_userId_key";
CREATE UNIQUE INDEX IF NOT EXISTS "settings_userId_key" ON "settings"("userId");

DROP INDEX IF EXISTS "Workflow_userId_idx";
CREATE INDEX IF NOT EXISTS "workflows_userId_idx" ON "workflows"("userId");

CREATE TABLE "workflowMetadata" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workflowId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "rulePrompt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflowMetadata_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "workflows" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "workflowMetadata" ("id", "workflowId", "key", "rulePrompt", "sortOrder", "createdAt", "updatedAt")
SELECT
    lower(hex(randomblob(12))),
    w."id",
    json_extract(j.value, '$.key'),
    CASE
      WHEN json_extract(j.value, '$.rulePrompt') IS NULL THEN NULL
      WHEN trim(json_extract(j.value, '$.rulePrompt')) = '' THEN NULL
      ELSE json_extract(j.value, '$.rulePrompt')
    END,
    j.key,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "workflows" w, json_each(COALESCE(NULLIF(w."metadataJson", ''), '[]')) j
WHERE typeof(json_extract(j.value, '$.key')) = 'text'
  AND length(trim(json_extract(j.value, '$.key'))) > 0;

CREATE TABLE "new_workflows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "filteringPrompt" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "workflows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_workflows" ("id", "userId", "name", "description", "language", "filteringPrompt", "createdAt", "updatedAt")
SELECT "id", "userId", "name", "description", "language", "filteringPrompt", "createdAt", "updatedAt"
FROM "workflows";

DROP TABLE "workflows";
ALTER TABLE "new_workflows" RENAME TO "workflows";

CREATE INDEX "workflows_userId_idx" ON "workflows"("userId");
CREATE INDEX "workflowMetadata_workflowId_idx" ON "workflowMetadata"("workflowId");
CREATE UNIQUE INDEX "workflowMetadata_workflowId_key_key" ON "workflowMetadata"("workflowId", "key");

CREATE TABLE "new_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_settings" ("id", "userId", "provider", "apiKey", "createdAt", "updatedAt")
SELECT "id", "userId", "provider", "apiKey", "createdAt", "updatedAt" FROM "settings";
DROP TABLE "settings";
ALTER TABLE "new_settings" RENAME TO "settings";
CREATE UNIQUE INDEX "settings_userId_key" ON "settings"("userId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
