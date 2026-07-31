/**
 * Crypto helpers for the NIC E-Way Bill API.
 *
 * Implements the hybrid encryption scheme defined in the official
 * "EWB-API Technical Document" (National Informatics Centre):
 *
 *   - RSA (PKCS1 padding) is used ONLY during authentication, to encrypt
 *     the password and the client-generated app_key, using the public
 *     key certificate NIC/your GSP gives you at registration.
 *   - AES-256 in ECB mode with PKCS7 padding is used for everything else:
 *     the server encrypts the returned "sek" (session encryption key)
 *     using your app_key as the AES key; you decrypt it with your app_key
 *     to get the real sek, then use that sek to encrypt every request
 *     payload and decrypt every response for the rest of the session
 *     (tokens/sek are valid ~6 hours).
 *
 * This file is provider-agnostic — it works whether you're calling NIC
 * directly (post threshold-based direct API registration) or a GSP
 * (Cleartax, MasterGST, Vayana, Adaequare, etc.), since all of them proxy
 * the same NIC crypto scheme. Only the base URL / header names differ
 * between providers — see ewaybill-client.ts.
 */

import * as crypto from "crypto";

/**
 * Encrypts `plainText` with the EWB public key certificate (RSA/PKCS1).
 * Used only for the `password` and `app_key` fields of the authenticate call.
 *
 * @param plainText   Text to encrypt (password, or the app_key string)
 * @param publicKeyPem PEM-encoded public key / certificate given by NIC or your GSP
 */
function normalizePem(pem: string): string {
  const normalized = pem
    .trim()
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r");

  if (normalized.includes("BEGIN") || normalized.includes("END")) {
    return normalized;
  }

  try {
    return Buffer.from(normalized, "base64").toString("utf8");
  } catch {
    return normalized;
  }
}

export function rsaEncrypt(plainText: string, publicKeyPem: string): string {
  const buffer = Buffer.from(plainText, "utf8");

  try {
    const normalizedPem = normalizePem(publicKeyPem);
    const publicKey = crypto.createPublicKey(normalizedPem);
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      buffer
    );
    return encrypted.toString("base64");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (
      message.includes("unsupported") ||
      message.includes("DECODER") ||
      message.includes("Invalid") ||
      message.includes("Cannot parse")
    ) {
      throw new Error(
        "Invalid EWB public key PEM. Provide a valid RSA public key or certificate."
      );
    }
    throw error;
  }
}

/**
 * AES-256/ECB/PKCS7 encrypt. Used for:
 *  - nothing during auth (auth uses RSA — see rsaEncrypt)
 *  - every e-way bill request payload once you have the decrypted `sek`
 *
 * `key` must decode to exactly 32 bytes for AES-256 (a 32-character
 * ASCII app_key, or a base64 sek that decodes to 32 bytes).
 */
export function aesEncrypt(plainText: string, key: Buffer): string {
  const cipher = crypto.createCipheriv("aes-256-ecb", key, null);
  // Node applies PKCS7 padding by default for block ciphers.
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(plainText, "utf8")),
    cipher.final(),
  ]);
  return encrypted.toString("base64");
}

/**
 * AES-256/ECB/PKCS7 decrypt. Used for:
 *  - decrypting the `sek` returned by the authenticate call (key = app_key bytes)
 *  - decrypting every subsequent API response's `data` field (key = sek bytes)
 */
export function aesDecrypt(cipherTextB64: string, key: Buffer): string {
  const decipher = crypto.createDecipheriv("aes-256-ecb", key, null);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherTextB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Generates a fresh random app_key for one auth session.
 * Must be exactly 32 ASCII bytes so it can double as an AES-256 key.
 */
export function generateAppKey(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  const bytes = crypto.randomBytes(32);
  for (let i = 0; i < 32; i++) {
    key += chars[bytes[i] % chars.length];
  }
  return key;
}