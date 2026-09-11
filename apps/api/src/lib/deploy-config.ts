import { hasEncryptionKey } from "./secrets/encrypt.js";

const WEAK_SECRETS = new Set([
  "change-me-in-local-dev",
  "change-me-in-local-docker",
  "change-me",
]);

export function isPublicDeploy(): boolean {
  return process.env.PUBLIC_DEPLOY === "true";
}

export function validateDeployConfig(): void {
  if (!isPublicDeploy()) {
    return;
  }

  const jwtSecret = process.env.JWT_SECRET?.trim() ?? "";
  if (
    jwtSecret.length < 32 ||
    WEAK_SECRETS.has(jwtSecret) ||
    jwtSecret.toLowerCase().includes("change-me")
  ) {
    throw new Error(
      "PUBLIC_DEPLOY requires a strong JWT_SECRET (min 32 characters, not a default value).",
    );
  }

  if (!hasEncryptionKey()) {
    throw new Error("PUBLIC_DEPLOY requires ENCRYPTION_KEY.");
  }

  if (process.env.TRUST_PROXY !== "true") {
    throw new Error("PUBLIC_DEPLOY requires TRUST_PROXY=true.");
  }
}
