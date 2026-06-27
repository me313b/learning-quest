// Encrypt the family's API key before it touches the database, and decrypt it
// only server-side when we need to call the model provider. The master key
// lives only in the server environment (APP_ENCRYPTION_KEY), never in the
// browser, so a database leak alone does not expose anyone's API key.
//
// Format of the stored string: base64( iv[12] | authTag[16] | ciphertext ).

import crypto from "crypto";

const ALGO = "aes-256-gcm";

function masterKey(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "APP_ENCRYPTION_KEY is not set. Generate one with: " +
        "node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"",
    );
  }
  // Accept base64 (preferred) or hex.
  let key = Buffer.from(raw, "base64");
  if (key.length !== 32) key = Buffer.from(raw, "hex");
  if (key.length !== 32) {
    throw new Error("APP_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }
  return key;
}

export function encryptSecret(plain: string): string {
  if (!plain) return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, masterKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptSecret(stored: string): string {
  if (!stored) return "";
  const buf = Buffer.from(stored, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, masterKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString(
    "utf8",
  );
}

// --------------------------------------------------------------------------- //
// Parent PIN hashing. The PIN is stored as a salted scrypt hash so a database
// leak never exposes the real PIN. Format: "scrypt$<saltHex>$<hashHex>".
// Older accounts may still have a plaintext PIN; we accept it once and re-hash
// on the next save.
// --------------------------------------------------------------------------- //
const PIN_PREFIX = "scrypt$";

export function isHashedPin(stored: string): boolean {
  return !!stored && stored.startsWith(PIN_PREFIX);
}

export function hashPin(pin: string): string {
  if (!pin) return "";
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(pin, salt, 32);
  return `${PIN_PREFIX}${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPin(pin: string, stored: string): boolean {
  if (!stored) return true; // no PIN configured → allow (parent can set one)
  if (!pin) return false;
  if (isHashedPin(stored)) {
    const parts = stored.split("$");
    const saltHex = parts[1];
    const hashHex = parts[2];
    if (!saltHex || !hashHex) return false;
    try {
      const expected = Buffer.from(hashHex, "hex");
      const actual = crypto.scryptSync(pin, Buffer.from(saltHex, "hex"), expected.length);
      return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
    } catch {
      return false;
    }
  }
  // Legacy plaintext PIN.
  return pin === stored;
}
