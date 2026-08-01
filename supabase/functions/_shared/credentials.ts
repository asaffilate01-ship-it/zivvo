import { env } from "./security.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function key(): Promise<CryptoKey> {
  const raw = base64ToBytes(env("DMS_CREDENTIAL_ENCRYPTION_KEY"));
  if (raw.byteLength !== 32) throw new Error("DMS encryption key must decode to 32 bytes");
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptCredential(value: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), encoder.encode(value)));
  return `v1.${bytesToBase64(iv)}.${bytesToBase64(ciphertext)}`;
}

export async function decryptCredential(value: string): Promise<string> {
  const [version, ivValue, ciphertextValue] = value.split(".");
  if (version !== "v1" || !ivValue || !ciphertextValue) throw new Error("Unsupported encrypted credential");
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(ivValue) }, await key(), base64ToBytes(ciphertextValue));
  return decoder.decode(plaintext);
}
