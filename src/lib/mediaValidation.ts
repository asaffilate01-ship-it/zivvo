export type SafeExtension = "jpg" | "png" | "webp" | "pdf" | "mp4" | "webm" | "mov";

export class FileValidationError extends Error {
  constructor(public code: "too_large" | "unsupported_type" | "invalid_signature" | "invalid_dimensions") {
    super(code);
  }
}

const MB = 1024 * 1024;

const beginsWith = (bytes: Uint8Array, signature: number[]) => signature.every((value, index) => bytes[index] === value);
const ascii = (bytes: Uint8Array, start: number, length: number) => String.fromCharCode(...bytes.slice(start, start + length));

const readArrayBuffer = (blob: Blob): Promise<ArrayBuffer> => {
  if (typeof blob.arrayBuffer === "function") return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error("File could not be read"));
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(blob);
  });
};

export const detectSafeExtension = async (file: Blob): Promise<SafeExtension | null> => {
  const bytes = new Uint8Array(await readArrayBuffer(file.slice(0, 16)));
  if (beginsWith(bytes, [0xff, 0xd8, 0xff])) return "jpg";
  if (beginsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 4) === "WEBP") return "webp";
  if (ascii(bytes, 0, 4) === "%PDF") return "pdf";
  if (ascii(bytes, 4, 4) === "ftyp") {
    const brand = ascii(bytes, 8, 4).toLowerCase();
    return brand.includes("qt") ? "mov" : "mp4";
  }
  if (beginsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return "webm";
  return null;
};

export const validateImageFile = async (file: File) => {
  if (file.size > 12 * MB) throw new FileValidationError("too_large");
  const extension = await detectSafeExtension(file);
  if (!extension || !["jpg", "png", "webp"].includes(extension)) throw new FileValidationError("invalid_signature");
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      const valid = bitmap.width >= 320 && bitmap.height >= 240 && bitmap.width <= 12_000 && bitmap.height <= 12_000;
      bitmap.close();
      if (!valid) throw new FileValidationError("invalid_dimensions");
    } catch (error) {
      if (error instanceof FileValidationError) throw error;
      throw new FileValidationError("invalid_signature");
    }
  }
  return { extension: extension as "jpg" | "png" | "webp" };
};

export const validateDocumentFile = async (file: File) => {
  if (file.size > 10 * MB) throw new FileValidationError("too_large");
  const extension = await detectSafeExtension(file);
  if (!extension || !["pdf", "jpg", "png", "webp"].includes(extension)) throw new FileValidationError("invalid_signature");
  return { extension: extension as "pdf" | "jpg" | "png" | "webp" };
};

export const validateVideoFile = async (file: File) => {
  if (file.size > 100 * MB) throw new FileValidationError("too_large");
  const extension = await detectSafeExtension(file);
  if (!extension || !["mp4", "webm", "mov"].includes(extension)) throw new FileValidationError("invalid_signature");
  return { extension: extension as "mp4" | "webm" | "mov" };
};

export const safeObjectPath = (userId: string, prefix: string, extension: SafeExtension) =>
  `${userId}/${prefix}-${crypto.randomUUID()}.${extension}`;
