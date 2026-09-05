export function hashPromptForCache(prompt: string): string {
  let hash = 2166136261;
  const text = prompt.trim();
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}
