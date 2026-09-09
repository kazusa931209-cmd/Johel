-- CreateTable
CREATE TABLE "generationJobEmbeddings" (
    "vector" BLOB NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "generationJobEmbeddings_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "generations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
