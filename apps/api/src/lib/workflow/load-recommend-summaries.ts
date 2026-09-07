import { prisma } from "../prisma.js";
import type { WorkflowRecommendSummary } from "../ai-workflow-recommend/types.js";
import {
  buildWorkflowRecommendSummary,
  buildWorkflowListFingerprint,
} from "./build-recommend-summary.js";

export { buildWorkflowListFingerprint } from "./build-recommend-summary.js";

export async function loadWorkflowRecommendSummaries(
  userId: string,
): Promise<WorkflowRecommendSummary[]> {
  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      profile: {
        select: { firstName: true, lastName: true },
      },
      companies: {
        orderBy: { sortOrder: "asc" },
        include: {
          company: { select: { name: true } },
          experiences: {
            orderBy: { sortOrder: "asc" },
            include: {
              experience: {
                select: {
                  id: true,
                  category: true,
                  problem: true,
                  actions: true,
                  outcome: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return workflows.map((workflow) => {
    const { profileName, experiences, companies } =
      buildWorkflowRecommendSummary(workflow);

    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      language: workflow.language,
      profileName,
      experiences,
      companies,
    };
  });
}
