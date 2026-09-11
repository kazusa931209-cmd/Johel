import { encryptSecret, decryptSecret, isEncryptedSecret } from "./encrypt.js";
import { prisma } from "../prisma.js";

export function encryptApiKeyForStorage(apiKey: string): string {
  return encryptSecret(apiKey);
}

export function decryptApiKeyFromStorage(stored: string): string {
  return decryptSecret(stored);
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
