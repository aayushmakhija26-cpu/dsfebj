import { describe, it, expect } from "vitest";
import { documentUploadSchema, MimeTypeSchema } from "@/schemas/document";

describe("MimeTypeSchema", () => {
  it("accepts PDF, JPEG, PNG", () => {
    expect(MimeTypeSchema.parse("application/pdf")).toBe("application/pdf");
    expect(MimeTypeSchema.parse("image/jpeg")).toBe("image/jpeg");
    expect(MimeTypeSchema.parse("image/png")).toBe("image/png");
  });

  it("rejects other mime types", () => {
    expect(() => MimeTypeSchema.parse("image/gif")).toThrow();
    expect(() => MimeTypeSchema.parse("application/msword")).toThrow();
  });
});

describe("documentUploadSchema", () => {
  const MAX = 10 * 1024 * 1024;
  const valid = {
    applicationId: "550e8400-e29b-41d4-a716-446655440000",
    documentType: "PAN",
    fileName: "pan-card.pdf",
    fileSize: 512 * 1024, // 512 KB
    mimeType: "application/pdf",
    storageKey: "uploads/applicants/pan-card.pdf",
  };

  it("accepts valid document upload", () => {
    expect(documentUploadSchema.parse(valid)).toMatchObject({ documentType: "PAN" });
  });

  it("rejects file exceeding 10 MB", () => {
    expect(() =>
      documentUploadSchema.parse({ ...valid, fileSize: MAX + 1 }),
    ).toThrow(/10 MB/);
  });

  it("accepts file exactly at 10 MB limit", () => {
    expect(() =>
      documentUploadSchema.parse({ ...valid, fileSize: MAX }),
    ).not.toThrow();
  });

  it("rejects zero-byte file", () => {
    expect(() =>
      documentUploadSchema.parse({ ...valid, fileSize: 0 }),
    ).toThrow();
  });
});
