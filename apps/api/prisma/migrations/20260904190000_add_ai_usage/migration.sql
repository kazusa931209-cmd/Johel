-- CreateTable
CREATE TABLE "aiUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "aiProvider" TEXT NOT NULL,
    "inputToken" INTEGER NOT NULL,
    "outputToken" INTEGER NOT NULL,
    "inputTokenUsage" INTEGER NOT NULL,
    "outputTokenUsage" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "aiUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "aiUsage_userId_idx" ON "aiUsage"("userId");

-- CreateIndex
CREATE INDEX "aiUsage_userId_createdAt_idx" ON "aiUsage"("userId", "createdAt");
