import {
  getCompany,
  getExperience,
  getWorkflow,
  type AuthorAdviseDraft,
  type AuthorAdviseProposal,
} from "@/lib/api";
import { mergeExperienceFieldUpdate } from "@/lib/merge-experience-field-update";

function resolveWorkflowId(
  proposal: AuthorAdviseProposal,
  drawerWorkflowId?: string,
): string | null {
  return (
    proposal.target.workflowId ??
    drawerWorkflowId ??
    proposal.link.workflowId ??
    null
  );
}

export async function buildAuthorAdviseDisplayDraft(
  proposal: AuthorAdviseProposal,
  drawerWorkflowId?: string,
): Promise<AuthorAdviseDraft> {
  const delta = proposal.draft;

  if (
    proposal.placement === "update_experience" &&
    proposal.target.experienceId
  ) {
    const experienceRes = await getExperience(proposal.target.experienceId);
    if (experienceRes.data) {
      const existing = experienceRes.data;
      return {
        category: delta.category ?? existing.category,
        problem: mergeExperienceFieldUpdate(existing.problem, delta.problem),
        actions: mergeExperienceFieldUpdate(existing.actions, delta.actions),
        outcome: mergeExperienceFieldUpdate(existing.outcome, delta.outcome),
        whatCompanyIs: delta.whatCompanyIs,
        domainAndStack: delta.domainAndStack,
        roleContext: delta.roleContext,
        workflowDescription: delta.workflowDescription,
      };
    }
  }

  if (proposal.placement === "update_company" && proposal.target.companyId) {
    const companyRes = await getCompany(proposal.target.companyId);
    if (companyRes.data) {
      const existing = companyRes.data;
      return {
        category: delta.category,
        problem: delta.problem,
        actions: delta.actions,
        outcome: delta.outcome,
        whatCompanyIs: mergeExperienceFieldUpdate(
          existing.whatCompanyIs,
          delta.whatCompanyIs,
        ),
        domainAndStack: mergeExperienceFieldUpdate(
          existing.domainAndStack,
          delta.domainAndStack,
        ),
        roleContext: delta.roleContext,
        workflowDescription: delta.workflowDescription,
      };
    }
  }

  if (proposal.placement === "update_role_context") {
    const workflowId = resolveWorkflowId(proposal, drawerWorkflowId);
    const companyId = proposal.target.companyId;
    if (workflowId && companyId) {
      const workflowRes = await getWorkflow(workflowId);
      if (workflowRes.data) {
        const entry = workflowRes.data.companies.find(
          (item) => item.companyId === companyId,
        );
        if (entry) {
          return {
            category: delta.category,
            problem: delta.problem,
            actions: delta.actions,
            outcome: delta.outcome,
            whatCompanyIs: delta.whatCompanyIs,
            domainAndStack: delta.domainAndStack,
            roleContext: mergeExperienceFieldUpdate(
              entry.roleContext,
              delta.roleContext,
            ),
            workflowDescription: delta.workflowDescription,
          };
        }
      }
    }
  }

  if (proposal.placement === "update_workflow_description") {
    const workflowId = resolveWorkflowId(proposal, drawerWorkflowId);
    if (workflowId) {
      const workflowRes = await getWorkflow(workflowId);
      if (workflowRes.data) {
        return {
          category: delta.category,
          problem: delta.problem,
          actions: delta.actions,
          outcome: delta.outcome,
          whatCompanyIs: delta.whatCompanyIs,
          domainAndStack: delta.domainAndStack,
          roleContext: delta.roleContext,
          workflowDescription: mergeExperienceFieldUpdate(
            workflowRes.data.description,
            delta.workflowDescription,
          ),
        };
      }
    }
  }

  return delta;
}
