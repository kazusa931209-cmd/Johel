export const WORKSPACE_UPDATED_EVENT = "johel:workspace-updated";

export type WorkspaceUpdatedDetail = {
  profileId?: string | null;
  experienceId?: string | null;
  companyId?: string | null;
};

export function dispatchWorkspaceUpdated(detail: WorkspaceUpdatedDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(WORKSPACE_UPDATED_EVENT, { detail }),
  );
}
