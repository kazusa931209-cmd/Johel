-- Company display priority (1-based sort order for list and Combine)

ALTER TABLE "companies" ADD COLUMN "displayPriority" INTEGER NOT NULL DEFAULT 1;

UPDATE "companies"
SET "displayPriority" = (
  SELECT "rowNumber"
  FROM (
    SELECT
      "id",
      ROW_NUMBER() OVER (PARTITION BY "userId" ORDER BY "name" ASC, "id" ASC) AS "rowNumber"
    FROM "companies"
  ) AS "ranked"
  WHERE "ranked"."id" = "companies"."id"
);
