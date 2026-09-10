export {
  EXPERIENCE_ADVISE_POOL_DEPTHS,
  DEFAULT_EXPERIENCE_ADVISE_POOL_DEPTH,
  isExperienceAdvisePoolDepth,
  normalizeExperienceAdvisePoolDepth,
  resolveExperienceAdviseFullStarK,
  type ExperienceAdvisePoolDepth,
} from "./pool-depth.js";
export { buildExperienceEmbeddingInput } from "./build-input.js";
export { upsertExperienceEmbedding } from "./upsert.js";
export { ensureExperienceEmbeddings } from "./ensure-embeddings.js";
export {
  selectExpandedExperienceIdsWithEmbedding,
  selectTopEmbeddingExperienceIds,
} from "./select-expanded-ids.js";
export {
  cosineSimilarity,
  deserializeEmbeddingVector,
  rankByCosine,
  serializeEmbeddingVector,
} from "./vector.js";
