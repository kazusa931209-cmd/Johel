export const GENERATE_SESSION_CHANGED_EVENT = "johel:generate-session-changed";

export type GenerateSessionChangedStatus = {
  generationId: string | null;
  generationPublicId: string | null;
  processedStep: string | null;
  finalized: boolean;
};

export type GenerateSessionChangedDetail = {
  userId: string;
  status?: GenerateSessionChangedStatus;
};

export function notifyGenerateSessionChanged(
  userId: string,
  status?: GenerateSessionChangedStatus,
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<GenerateSessionChangedDetail>(
      GENERATE_SESSION_CHANGED_EVENT,
      { detail: { userId, status } },
    ),
  );
}
