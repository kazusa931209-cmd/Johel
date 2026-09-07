import { buildWorkflowGenerationFingerprint } from "../resume/generation-fingerprint.js";
import { prisma } from "../prisma.js";

export async function buildAuthorAdviseWorkspaceFingerprint(
  userId: string,
  workflowId?: string,
): Promise<string> {
  if (workflowId) {
    return buildWorkflowGenerationFingerprint(userId, workflowId);
  }

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { id: "asc" },
    select: { id: true },
  });

  const fingerprints: { workflowId: string; fingerprint: string }[] = [];
  for (const workflow of workflows) {
    try {
      const fingerprint = await buildWorkflowGenerationFingerprint(
        userId,
        workflow.id,
      );
      fingerprints.push({ workflowId: workflow.id, fingerprint });
    } catch {
      fingerprints.push({
        workflowId: workflow.id,
        fingerprint: `incomplete:${workflow.id}`,
      });
    }
  }

  return JSON.stringify(fingerprints);
}
