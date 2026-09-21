-- Phase 68: experience embeddings + advisor pool depth setting

CREATE TABLE "experienceEmbeddings" (
    "experienceId" TEXT NOT NULL PRIMARY KEY,
    "model" TEXT NOT NULL,
    "vector" BLOB NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "experienceEmbeddings_experienceId_fkey" FOREIGN KEY ("experienceId") REFERENCES "experiences" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "generationProcess" ADD COLUMN "experienceAdvisePoolDepth" TEXT NOT NULL DEFAULT 'normal';

UPDATE "settings" SET "provider" = 'openai' WHERE "provider" = 'cursor';
