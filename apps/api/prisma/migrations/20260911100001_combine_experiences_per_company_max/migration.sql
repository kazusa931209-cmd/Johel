-- Phase 85: Combine suggest max experiences per company setting

ALTER TABLE "generationProcess" ADD COLUMN "combineExperiencesPerCompanyMax" INTEGER NOT NULL DEFAULT 5;
