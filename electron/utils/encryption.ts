/**
 * Encryption Utility for API Keys
 * Provides secure storage and retrieval of sensitive credentials
 * Uses electron's safeStorage API when available
 */

import { safeStorage } from "electron";

/**
 * Check if encryption is available on this system
 */
export function isEncryptionAvailable(): boolean {
  return safeStorage.isEncryptionAvailable();
}

/**
 * Encrypt a string value using electron's safeStorage
 * Falls back to base64 encoding if encryption is not available
 * @param value - The value to encrypt
 * @returns Encrypted buffer as base64 string
 */
export function encryptString(value: string): string {
  if (!value) {
    return "";
  }

  if (safeStorage.isEncryptionAvailable()) {
    const encrypted = safeStorage.encryptString(value);
    return encrypted.toString("base64");
  }

  // Fallback: base64 encoding (NOT secure, but allows functionality)
  console.warn("SafeStorage not available, using base64 encoding (not secure)");
  return Buffer.from(value).toString("base64");
}

/**
 * Decrypt a string value using electron's safeStorage
 * Falls back to base64 decoding if encryption is not available
 * @param encryptedValue - The base64 encoded encrypted value
 * @returns Decrypted string
 */
export function decryptString(encryptedValue: string): string {
  if (!encryptedValue) {
    return "";
  }

  try {
    const buffer = Buffer.from(encryptedValue, "base64");

    if (safeStorage.isEncryptionAvailable()) {
      return safeStorage.decryptString(buffer);
    }

    // Fallback: base64 decoding
    return buffer.toString("utf-8");
  } catch (error) {
    console.error("Failed to decrypt value:", error);
    return "";
  }
}

/**
 * Safely store an API key
 * @param key - The API key to store
 * @returns Object with encrypted key and metadata
 */
export function encryptApiKey(
  key: string,
): { encrypted: string; method: "safeStorage" | "base64" } {
  const encrypted = encryptString(key);
  const method = safeStorage.isEncryptionAvailable() ? "safeStorage" : "base64";
  return { encrypted, method };
}

/**
 * Retrieve a stored API key
 * @param encrypted - The encrypted key
 * @returns Decrypted API key
 */
export function decryptApiKey(encrypted: string): string {
  return decryptString(encrypted);
}

/**
 * Validate that an API key looks valid (basic format check)
 * @param key - The API key to validate
 * @param provider - The provider type for format checking
 * @returns Whether the key appears valid
 */
export function validateApiKeyFormat(
  key: string,
  provider: "openai" | "ollama",
): boolean {
  if (!key || typeof key !== "string") {
    return false;
  }

  if (provider === "openai") {
    // OpenAI keys start with 'sk-' and are typically 40+ characters
    return key.startsWith("sk-") && key.length >= 40;
  }

  // Ollama doesn't require API key, but if provided, just check it's not empty
  return key.length > 0;
}
