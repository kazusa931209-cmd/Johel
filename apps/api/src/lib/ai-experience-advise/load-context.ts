import { createHash } from "node:crypto";
import { prisma } from "../prisma.js";
import type { ExperienceAdviseGraph } from "./types.js";

export type ExperienceAdviseLoadResult = {
  graph: ExperienceAdviseGraph;
  workspaceFingerprint: string;
};

function buildFingerprintFromRows(
  rows: Array<{ id: string; updatedAt: Date }>,
): string {
  const payload = rows
    .map((row) => `${row.id}:${row.updatedAt.toISOString()}`)
    .join("|");
  return createHash("sha256").update(payload).digest("hex");
}

export async function loadExperienceAdviseContext(
  userId: string,
  targetExperienceId?: string,
): Promise<ExperienceAdviseLoadResult> {
  if (targetExperienceId) {
    const target = await prisma.experience.findFirst({
      where: { id: targetExperienceId, userId },
      select: { id: true },
    });
    if (!target) {
      throw new Error("Experience was not found.");
    }
  }

  const rows = await prisma.experience.findMany({
    where: { userId },
    orderBy: { category: "asc" },
    select: {
      id: true,
      category: true,
      problem: true,
      actions: true,
      outcome: true,
      updatedAt: true,
    },
  });

  const fingerprintRows = [...rows]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((row) => ({ id: row.id, updatedAt: row.updatedAt }));

  return {
    graph: {
      experiences: rows,
      targetExperienceId: targetExperienceId ?? null,
    },
    workspaceFingerprint: buildFingerprintFromRows(fingerprintRows),
  };
}

export function buildExperienceAdviseFingerprintFromGraph(
  graph: ExperienceAdviseGraph,
): string {
  const fingerprintRows = [...graph.experiences]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((row) => ({ id: row.id, updatedAt: row.updatedAt }));
  return buildFingerprintFromRows(fingerprintRows);
}
