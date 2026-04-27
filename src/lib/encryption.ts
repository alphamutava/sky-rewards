import crypto from "crypto";

// Fallback key for dev if missing. IN PRODUCTION THIS MUST BE A 32 BYTE HEX STRING.
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");
const ALGORITHM = "aes-256-gcm";

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @param text The plaintext string to encrypt.
 * @returns The ciphertext in the format: iv:authTag:encryptedText
 */
export function encryptString(text: string): string {
  if (!text) return text;
  
  // Use a deterministic IV based on the plaintext to allow exact-match searching
  // Note: For fully secure searchable PII, a Blind Index (SHA256 hash column) is preferred.
  const iv = crypto.createHmac("sha256", ENCRYPTION_KEY).update(text).digest().subarray(0, 12);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a ciphertext string using AES-256-GCM.
 * @param text The ciphertext to decrypt.
 * @returns The original plaintext string.
 */
export function decryptString(text: string): string {
  if (!text || !text.includes(":")) return text; // Not encrypted

  try {
    const [ivHex, authTagHex, encryptedText] = text.split(":");
    
    if (!ivHex || !authTagHex || !encryptedText) return text;

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      Buffer.from(ENCRYPTION_KEY, "hex"),
      Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption failed. Data may be corrupted or key changed.", error);
    return "[ENCRYPTED_DATA_UNREADABLE]";
  }
}
