export type AiTokenUsedResponse = {
  tokenUsed: number;
};

export function withTokenUsed<T extends Record<string, unknown>>(
  payload: T,
  tokenUsed: number,
): T & AiTokenUsedResponse {
  return {
    ...payload,
    tokenUsed,
  };
}
