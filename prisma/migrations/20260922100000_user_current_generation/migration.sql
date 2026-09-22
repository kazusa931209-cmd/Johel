-- AlterTable
ALTER TABLE "users" ADD COLUMN "currentGenerationId" TEXT;

-- Backfill: point each user at their most recently updated generation.
UPDATE "users"
SET "currentGenerationId" = (
  SELECT "id"
  FROM "generations"
  WHERE "generations"."userId" = "users"."id"
  ORDER BY "updatedAt" DESC
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM "generations" WHERE "generations"."userId" = "users"."id"
);
