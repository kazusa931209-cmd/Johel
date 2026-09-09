-- Profile education split: university, graduationYear, degree

ALTER TABLE "profiles" ADD COLUMN "university" TEXT;
ALTER TABLE "profiles" ADD COLUMN "graduationYear" INTEGER;
ALTER TABLE "profiles" ADD COLUMN "degree" TEXT;

UPDATE "profiles" SET "university" = "education" WHERE "education" IS NOT NULL;

-- Redefine profiles without education column (SQLite table rebuild)
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TEXT,
    "email" TEXT,
    "pn" TEXT,
    "residence" TEXT,
    "university" TEXT,
    "graduationYear" INTEGER,
    "degree" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_profiles" (
    "id", "userId", "firstName", "lastName", "birthDate", "email", "pn",
    "residence", "university", "graduationYear", "degree", "createdAt", "updatedAt"
)
SELECT
    "id", "userId", "firstName", "lastName", "birthDate", "email", "pn",
    "residence", "university", "graduationYear", "degree", "createdAt", "updatedAt"
FROM "profiles";

DROP TABLE "profiles";
ALTER TABLE "new_profiles" RENAME TO "profiles";
CREATE INDEX "profiles_userId_idx" ON "profiles"("userId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
