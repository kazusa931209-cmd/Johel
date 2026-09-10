export function hashJobEmbeddingSource(text: string): string {
  let hash = 2166136261;
  const normalized = text.trim();
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
