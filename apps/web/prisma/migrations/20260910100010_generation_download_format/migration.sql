-- Phase 80: resume download format setting (docx | pdf)

ALTER TABLE "generationProcess" ADD COLUMN "downloadFormat" TEXT NOT NULL DEFAULT 'docx';
