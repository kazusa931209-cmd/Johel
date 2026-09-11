import { isAiProviderId, type AiProviderId } from "./ai-provider.js";
import { prisma } from "./prisma.js";
import { decryptApiKeyFromStorage } from "./secrets/api-key.js";

export type UserAiSettings = {
  provider: AiProviderId;
  apiKey: string;
};

const NOT_CONFIGURED =
  "AI Agent is not configured. Save a provider and API key in Settings first.";

export async function getUserAiSettings(
  userId: string,
): Promise<UserAiSettings | null> {
  const setting = await prisma.setting.findUnique({
    where: { userId },
  });
  if (!setting?.apiKey || !setting.provider) {
    return null;
  }
  if (!isAiProviderId(setting.provider)) {
    return null;
  }

  return {
    provider: setting.provider,
    apiKey: decryptApiKeyFromStorage(setting.apiKey),
  };
}

export async function requireUserAiSettings(userId: string): Promise<UserAiSettings> {
  const settings = await getUserAiSettings(userId);
  if (!settings) {
    throw new Error(NOT_CONFIGURED);
  }
  return settings;
}
