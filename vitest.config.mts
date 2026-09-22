import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
  },
  resolve: {
    alias: [
      {
        find: "@johel/resume/docx",
        replacement: path.resolve(rootDir, "./src/packages/resume/docx-builder/index.ts"),
      },
      {
        find: "@johel/resume/pdf",
        replacement: path.resolve(rootDir, "./src/packages/resume/pdf-builder/index.ts"),
      },
      {
        find: "@johel/resume",
        replacement: path.resolve(rootDir, "./src/packages/resume/index.ts"),
      },
      {
        find: "@johel/jd-meta",
        replacement: path.resolve(rootDir, "./src/packages/jd-meta/index.ts"),
      },
      {
        find: "@johel/prompt-defaults",
        replacement: path.resolve(rootDir, "./src/packages/prompt-defaults/index.ts"),
      },
      { find: "@", replacement: path.resolve(rootDir, "./src") },
    ],
  },
});
