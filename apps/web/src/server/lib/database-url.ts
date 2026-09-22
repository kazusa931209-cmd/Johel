/**
 * True when the app or build should use Turso/libSQL instead of a local SQLite file.
 * `file:` URLs always use local SQLite even if TURSO_AUTH_TOKEN is set.
 */
export function isTursoDatabaseUrl(databaseUrl: string | undefined): boolean {
  if (!databaseUrl?.trim()) {
    return false;
  }
  const url = databaseUrl.trim();
  if (url.startsWith("file:")) {
    return false;
  }
  if (url.startsWith("libsql://") || url.startsWith("https://")) {
    return true;
  }
  return Boolean(process.env.TURSO_AUTH_TOKEN?.trim());
}
