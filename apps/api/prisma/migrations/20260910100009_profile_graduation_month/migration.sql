-- AlterTable
ALTER TABLE "profiles" ADD COLUMN "graduationMonth" INTEGER;

-- Default existing profiles to January for Combine period slider minimum.
UPDATE "profiles" SET "graduationMonth" = 1 WHERE "graduationMonth" IS NULL AND "graduationYear" IS NOT NULL;
