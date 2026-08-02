import { describe, expect, it } from "vitest";
import { detectSafeExtension, FileValidationError, validateDocumentFile, validateVideoFile } from "@/lib/mediaValidation";

const file = (bytes: number[] | string, name: string, type: string) => new File(
  [typeof bytes === "string" ? new TextEncoder().encode(bytes) : new Uint8Array(bytes)],
  name,
  { type },
);

describe("media validation", () => {
  it("detects content from magic bytes instead of the filename", async () => {
    const disguisedPdf = file("%PDF-1.7 test", "vehicle.jpg", "image/jpeg");
    await expect(detectSafeExtension(disguisedPdf)).resolves.toBe("pdf");
    await expect(validateDocumentFile(disguisedPdf)).resolves.toEqual({ extension: "pdf" });
  });

  it("accepts WebM from its EBML signature", async () => {
    const webm = file([0x1a, 0x45, 0xdf, 0xa3, 0x00, 0x00], "clip.webm", "video/webm");
    await expect(validateVideoFile(webm)).resolves.toEqual({ extension: "webm" });
  });

  it("rejects executable or unknown content even with a safe extension", async () => {
    const executable = file([0x4d, 0x5a, 0x90, 0x00], "document.pdf", "application/pdf");
    await expect(validateDocumentFile(executable)).rejects.toMatchObject({ code: "invalid_signature" } satisfies Partial<FileValidationError>);
  });
});
