export const GENERATION_FINALIZED_EVENT = "johel:generation-finalized";

export function notifyGenerationFinalized(publicId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(GENERATION_FINALIZED_EVENT, { detail: { publicId } }),
  );
}
