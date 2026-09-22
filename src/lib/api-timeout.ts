/** Baseline request timeout before Phase 20 expansion (30 seconds). */
export const API_TIMEOUT_BASELINE_MS = 30_000;

/** Client and dev-proxy timeout for API calls (10× baseline). */
export const API_TIMEOUT_MS = API_TIMEOUT_BASELINE_MS * 10;

/** AI routes (ai-verdict, ai-resume) use the same extended timeout. */
export const AI_API_TIMEOUT_MS = API_TIMEOUT_MS;
