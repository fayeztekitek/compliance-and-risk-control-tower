import crypto from "crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const SALT = "nexus-credential-store-v1";

interface StoredCredential {
  url: string;
  username: string;
  token: string;
  createdAt: Date;
}

interface EncryptedEntry {
  iv: string;
  tag: string;
  data: string;
}

const store = new Map<string, EncryptedEntry>();

function deriveKey(secret: string): Buffer {
  return crypto.scryptSync(secret, SALT, KEY_LENGTH);
}

function encrypt(plaintext: string, key: Buffer): EncryptedEntry {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return { iv: iv.toString("hex"), tag, data: encrypted };
}

function decrypt(entry: EncryptedEntry, key: Buffer): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(entry.iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(entry.tag, "hex"));
  let decrypted = decipher.update(entry.data, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

function getEncryptionKey(): Buffer {
  const secret = env.CREDENTIAL_ENCRYPTION_KEY || env.JWT_SECRET || "default-dev-key-change-in-prod";
  return deriveKey(secret);
}

export const credentialStore = {
  store(creds: StoredCredential): string {
    const sessionId = crypto.randomUUID();
    const key = getEncryptionKey();
    const plaintext = JSON.stringify(creds);
    const entry = encrypt(plaintext, key);
    store.set(sessionId, entry);

    // Auto-expire after 1 hour
    setTimeout(() => store.delete(sessionId), 3600_000);

    return sessionId;
  },

  retrieve(sessionId: string): StoredCredential | null {
    const entry = store.get(sessionId);
    if (!entry) return null;
    try {
      const key = getEncryptionKey();
      const plaintext = decrypt(entry, key);
      return JSON.parse(plaintext) as StoredCredential;
    } catch {
      store.delete(sessionId);
      return null;
    }
  },

  revoke(sessionId: string): void {
    store.delete(sessionId);
  },
};
