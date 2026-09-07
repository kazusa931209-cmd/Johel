import {
  getCompany,
  getExperience,
  getWorkflow,
  type AuthorAdviseDraft,
  type AuthorAdviseProposal,
} from "@/lib/api";

function excerptText(text: string, maxLen = 140): string {
  const oneLine = text.trim().replace(/\s+/g, " ");
  if (!oneLine) return "";
  if (oneLine.length <= maxLen) return oneLine;
  return `${oneLine.slice(0, maxLen)}…`;
}

function draftExperienceFieldLabels(draft: AuthorAdviseDraft): string[] {
  const labels: string[] = [];
  if (draft.category?.trim()) labels.push("Category");
  if (draft.problem?.trim()) labels.push("Problem");
  if (draft.actions?.trim()) labels.push("Actions");
  if (draft.outcome?.trim()) labels.push("Outcome");
  return labels;
}

function appendExperienceTargetLines(
  lines: string[],
  experience: {
    category: string;
    problem: string;
    actions: string;
    outcome: string;
  },
  draft: AuthorAdviseDraft,
  mode: "update" | "link",
) {
  const category = experience.category.trim();
  if (category) {
    lines.push(`Experience: ${category}`);
  }

  const problemExcerpt = excerptText(experience.problem);
  if (problemExcerpt) {
    lines.push(`Card problem (current): ${problemExcerpt}`);
  }

  const fieldLabels = draftExperienceFieldLabels(draft);
  if (fieldLabels.length > 0) {
    lines.push(
      mode === "update"
        ? `Content will be applied to: ${fieldLabels.join(", ")}`
        : `Experience fields: ${fieldLabels.join(", ")}`,
    );
  }

  if (mode === "update" && draft.actions?.trim()) {
    const actionsExcerpt = excerptText(experience.actions);
    if (actionsExcerpt) {
      lines.push(`Current Actions (excerpt): ${actionsExcerpt}`);
    }
  }
}

export async function loadSuggestionWhereLines(
  proposal: AuthorAdviseProposal,
  draft?: AuthorAdviseDraft | null,
): Promise<string[]> {
  const { placement, target, link } = proposal;
  const draftFields = draft ?? proposal.draft;
  const lines: string[] = [];

  const workflowId = target.workflowId ?? link.workflowId;
  const companyId = target.companyId ?? link.companyId;
  const experienceId = target.experienceId ?? link.experienceId;

  if (placement === "update_experience") {
    if (target.experienceId) {
      const experienceRes = await getExperience(target.experienceId);
      if (experienceRes.data) {
        appendExperienceTargetLines(lines, experienceRes.data, draftFields, "update");
      } else if (draftFields.category?.trim()) {
        lines.push(`Experience: ${draftFields.category.trim()}`);
      } else {
        lines.push("Experience card: (could not load)");
      }
    } else if (draftFields.category?.trim()) {
      lines.push(`Experience: ${draftFields.category.trim()}`);
      const fieldLabels = draftExperienceFieldLabels(draftFields);
      if (fieldLabels.length > 0) {
        lines.push(`Content will be applied to: ${fieldLabels.join(", ")}`);
      }
    }

    if (workflowId) {
      const workflowRes = await getWorkflow(workflowId);
      if (workflowRes.data) {
        lines.push(`Workflow: ${workflowRes.data.name}`);
        const linkedEntries = workflowRes.data.companies.filter((entry) =>
          entry.experienceIds.includes(target.experienceId!),
        );
        if (companyId) {
          const companyRes = await getCompany(companyId);
          const companyName = companyRes.data?.name ?? companyId;
          const entry = workflowRes.data.companies.find(
            (item) => item.companyId === companyId,
          );
          if (entry?.experienceIds.includes(target.experienceId!)) {
            lines.push(
              `Linked under ${companyName} (${entry.startDate} – ${entry.endDate}).`,
            );
          } else {
            lines.push(`Employer context: ${companyName}.`);
          }
        } else if (linkedEntries.length > 0) {
          for (const entry of linkedEntries) {
            const companyRes = await getCompany(entry.companyId);
            const companyName = companyRes.data?.name ?? entry.companyId;
            lines.push(
              `Linked under ${companyName} (${entry.startDate} – ${entry.endDate}).`,
            );
          }
        }
      }
    } else if (companyId) {
      const companyRes = await getCompany(companyId);
      if (companyRes.data) {
        lines.push(`Employer context: ${companyRes.data.name}`);
      }
    }

    lines.push(
      "Applying updates the shared Experience card (every workflow that links it uses the same text).",
    );
    return lines;
  }

  if (placement === "create_experience") {
    const category = draftFields.category?.trim();
    if (category) {
      lines.push(`New experience card: ${category}`);
      const fieldLabels = draftExperienceFieldLabels(draftFields);
      if (fieldLabels.length > 0) {
        lines.push(`Card will include: ${fieldLabels.join(", ")}`);
      }
    } else {
      lines.push("New shared Experience card.");
    }

    if (workflowId || companyId) {
      if (workflowId) {
        const workflowRes = await getWorkflow(workflowId);
        if (workflowRes.data) {
          lines.push(`Workflow: ${workflowRes.data.name}`);
        }
      }
      if (companyId) {
        const companyRes = await getCompany(companyId);
        if (companyRes.data) {
          lines.push(`Link to employer: ${companyRes.data.name}`);
        }
      }
    } else {
      lines.push("New shared Experience card (not linked until you add it in a workflow).");
    }
    return lines;
  }

  if (placement === "link_existing") {
    if (experienceId) {
      const experienceRes = await getExperience(experienceId);
      if (experienceRes.data) {
        appendExperienceTargetLines(lines, experienceRes.data, draftFields, "link");
      }
    }
    if (workflowId) {
      const workflowRes = await getWorkflow(workflowId);
      if (workflowRes.data) {
        lines.push(`Workflow: ${workflowRes.data.name}`);
      }
    }
    if (companyId) {
      const companyRes = await getCompany(companyId);
      if (companyRes.data) {
        lines.push(`Employer entry: ${companyRes.data.name}`);
      }
    }
    lines.push("Adds this experience card to the workflow company entry above.");
    return lines;
  }

  if (placement === "update_company" && companyId) {
    const companyRes = await getCompany(companyId);
    if (companyRes.data) {
      lines.push(`Company: ${companyRes.data.name}`);
      if (companyRes.data.alias.trim()) {
        lines.push(`Alias: ${companyRes.data.alias}`);
      }
    }
    return lines;
  }

  if (placement === "update_role_context" && workflowId && companyId) {
    const workflowRes = await getWorkflow(workflowId);
    const companyRes = await getCompany(companyId);
    if (workflowRes.data) {
      lines.push(`Workflow: ${workflowRes.data.name}`);
    }
    if (companyRes.data) {
      lines.push(`Employer entry: ${companyRes.data.name}`);
      const entry = workflowRes.data?.companies.find(
        (item) => item.companyId === companyId,
      );
      if (entry) {
        lines.push(`Period: ${entry.startDate} – ${entry.endDate}`);
      }
    }
    return lines;
  }

  if (placement === "update_workflow_description" && workflowId) {
    const workflowRes = await getWorkflow(workflowId);
    if (workflowRes.data) {
      lines.push(`Workflow: ${workflowRes.data.name}`);
    }
    return lines;
  }

  return lines;
}
