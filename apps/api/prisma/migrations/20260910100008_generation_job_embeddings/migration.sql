-- CreateTable
CREATE TABLE "generationJobEmbeddings" (
    "generationId" TEXT NOT NULL PRIMARY KEY,
    "model" TEXT NOT NULL,
    "vector" BLOB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "generationJobEmbeddings_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
