import type {
  WorkflowRecommendCompanySummary,
  WorkflowRecommendExperienceSummary,
  WorkflowRecommendSummary,
} from "../ai-workflow-recommend/types.js";

export type WorkflowRecommendCompanyRow = {
  startDate: string;
  endDate: string;
  company: { name: string };
  experiences: {
    experienceId: string;
    experience: {
      id: string;
      category: string;
      description: string;
    };
  }[];
};

export type WorkflowRecommendWorkflowRow = {
  id: string;
  name: string;
  description: string | null;
  language: string;
  profile: { firstName: string; lastName: string } | null;
  companies: WorkflowRecommendCompanyRow[];
};

export function buildWorkflowRecommendSummary(
  workflow: WorkflowRecommendWorkflowRow,
): Pick<
  WorkflowRecommendSummary,
  "experiences" | "companies" | "profileName"
> {
  const experiences: WorkflowRecommendExperienceSummary[] = [];
  const experienceIndex = new Map<string, number>();

  const companies: WorkflowRecommendCompanySummary[] = workflow.companies.map(
    (entry) => {
      const experienceIds: string[] = [];

      for (const link of entry.experiences) {
        const { id, category, description } = link.experience;
        experienceIds.push(id);

        if (!experienceIndex.has(id)) {
          experienceIndex.set(id, experiences.length);
          experiences.push({ id, category, description });
        }
      }

      return {
        name: entry.company.name,
        startDate: entry.startDate,
        endDate: entry.endDate,
        experienceIds,
      };
    },
  );

  return {
    profileName: workflow.profile
      ? `${workflow.profile.firstName} ${workflow.profile.lastName}`.trim()
      : "Not selected",
    experiences,
    companies,
  };
}

export function buildWorkflowListFingerprint(
  summaries: WorkflowRecommendSummary[],
): string {
  return JSON.stringify(
    summaries.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      language: item.language,
      profileName: item.profileName,
      experiences: item.experiences,
      companies: item.companies,
    })),
  );
}
