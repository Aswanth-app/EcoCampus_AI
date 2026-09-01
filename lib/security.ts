import crypto from "crypto";

/**
 * Generates a SHA-256 hash of a raw device API key for secure verification.
 * Raw API keys are NEVER stored in plaintext in the database or server logs.
 */
export function hashDeviceApiKey(apiKey: string): string {
  if (!apiKey) return "";
  return crypto.createHash("sha256").update(apiKey.trim()).digest("hex");
}

/**
 * Performs timing-safe comparison between expected and actual hash strings
 * to prevent side-channel timing attacks.
 */
export function safeHashCompare(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
