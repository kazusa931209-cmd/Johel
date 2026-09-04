-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TEXT,
    "email" TEXT,
    "pn" TEXT,
    "residence" TEXT,
    "education" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "profileLinks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "link" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "profileLinks_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "profiles_userId_idx" ON "profiles"("userId");

-- CreateIndex
CREATE INDEX "profileLinks_profileId_idx" ON "profileLinks"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "profileLinks_profileId_key_key" ON "profileLinks"("profileId", "key");
