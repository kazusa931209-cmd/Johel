import { encryptSecret, decryptSecret, isEncryptedSecret } from "./encrypt";
import { prisma } from "../prisma";

export class ApiKeyDecryptError extends Error {
  readonly code = "API_KEY_DECRYPT_FAILED" as const;

  constructor() {
    super(
      "Stored API key cannot be decrypted. Re-save your API key in Settings, or set ENCRYPTION_KEY to the value used when it was saved.",
    );
    this.name = "ApiKeyDecryptError";
  }
}

export function encryptApiKeyForStorage(apiKey: string): string {
  return encryptSecret(apiKey);
}

export function decryptApiKeyFromStorage(stored: string): string {
  try {
    return decryptSecret(stored);
  } catch {
    if (isEncryptedSecret(stored)) {
      throw new ApiKeyDecryptError();
    }
    throw new Error("Failed to read stored API key.");
  }
}

export async function migratePlaintextApiKeys(): Promise<number> {
  if (!process.env.ENCRYPTION_KEY?.trim()) {
    return 0;
  }

  const settings = await prisma.setting.findMany({
    select: { id: true, apiKey: true },
  });

  let migrated = 0;
  for (const setting of settings) {
    if (isEncryptedSecret(setting.apiKey)) {
      continue;
    }

    await prisma.setting.update({
      where: { id: setting.id },
      data: { apiKey: encryptApiKeyForStorage(setting.apiKey) },
    });
    migrated += 1;
  }

  return migrated;
}
