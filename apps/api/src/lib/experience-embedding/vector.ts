export function serializeEmbeddingVector(vector: number[]): Buffer {
  return Buffer.from(new Float32Array(vector).buffer);
}

export function deserializeEmbeddingVector(buffer: Buffer): number[] {
  return Array.from(
    new Float32Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength / Float32Array.BYTES_PER_ELEMENT,
    ),
  );
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < a.length; index += 1) {
    dot += a[index]! * b[index]!;
    normA += a[index]! * a[index]!;
    normB += b[index]! * b[index]!;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function rankByCosine(
  queryVector: number[],
  candidates: Array<{ id: string; vector: number[] }>,
): Array<{ id: string; score: number }> {
  return candidates
    .map((candidate) => ({
      id: candidate.id,
      score: cosineSimilarity(queryVector, candidate.vector),
    }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
