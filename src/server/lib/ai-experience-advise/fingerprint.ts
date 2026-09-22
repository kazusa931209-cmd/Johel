import { loadExperienceAdviseContext } from "./load-context";

export async function buildExperienceAdviseFingerprint(
  userId: string,
): Promise<string> {
  const { workspaceFingerprint } = await loadExperienceAdviseContext(userId);
  return workspaceFingerprint;
}
