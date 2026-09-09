/** Prevents duplicate auto-run API calls (e.g. React Strict Mode double effects). */
const inFlightKeys = new Set<string>();

export function claimAutoRun(key: string): boolean {
  if (inFlightKeys.has(key)) {
    return false;
  }
  inFlightKeys.add(key);
  return true;
}

export function releaseAutoRun(key: string): void {
  inFlightKeys.delete(key);
}

export function isAutoRunInFlight(key: string): boolean {
  return inFlightKeys.has(key);
}

/** @internal Test helper */
export function resetAutoRunClaims(): void {
  inFlightKeys.clear();
}
