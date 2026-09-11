import { invalidateWorkspaceCrudCaches } from "@/lib/cached-crud-list";
import { dispatchWorkspaceUpdated } from "@/lib/workspace-updated";

/** Invalidate list + PCE caches after experience create, update, or delete. */
export function notifyExperienceWorkspaceChanged(experienceId?: string | null) {
  invalidateWorkspaceCrudCaches("experiences");
  dispatchWorkspaceUpdated({
    experienceId: experienceId ?? null,
  });
}
