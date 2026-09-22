import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

export const ENCRYPTED_SECRET_PREFIX = "enc:v1:";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function decodeEncryptionKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY?.trim();
  if (!raw) {
    throw new Error("ENCRYPTION_KEY is not set.");
  }

  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must decode to 32 bytes (base64).");
  }

  return key;
}

export function hasEncryptionKey(): boolean {
  try {
    decodeEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

export function isEncryptedSecret(stored: string): boolean {
  return stored.startsWith(ENCRYPTED_SECRET_PREFIX);
}

export function encryptSecret(plaintext: string): string {
  const trimmed = plaintext.trim();
  if (!trimmed) {
    throw new Error("Cannot encrypt an empty secret.");
  }

  if (!hasEncryptionKey()) {
    if (process.env.PUBLIC_DEPLOY === "true") {
      throw new Error("ENCRYPTION_KEY is required for public deployment.");
    }
    return trimmed;
  }

  const key = decodeEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(trimmed, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, ciphertext]).toString("base64url");

  return `${ENCRYPTED_SECRET_PREFIX}${payload}`;
}

export function decryptSecret(stored: string): string {
  if (!isEncryptedSecret(stored)) {
    return stored;
  }

  if (!process.env.ENCRYPTION_KEY?.trim()) {
    throw new Error(
      "ENCRYPTION_KEY is not set but stored secrets are encrypted. Set the same ENCRYPTION_KEY used when they were saved.",
    );
  }

  const key = decodeEncryptionKey();
  const raw = Buffer.from(stored.slice(ENCRYPTED_SECRET_PREFIX.length), "base64url");
  if (raw.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error("Stored secret payload is invalid.");
  }

  const iv = raw.subarray(0, IV_LENGTH);
  const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8",
  );
}
