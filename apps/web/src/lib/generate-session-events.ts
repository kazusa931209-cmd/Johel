export const GENERATE_SESSION_CHANGED_EVENT = "johel:generate-session-changed";

export function notifyGenerateSessionChanged(userId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(GENERATE_SESSION_CHANGED_EVENT, { detail: { userId } }),
  );
}
