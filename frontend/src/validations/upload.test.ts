import { describe, expect, it } from "vitest";

import { MAX_FILE_SIZE_BYTES, validateFile } from "./upload";

function makeFile(name: string, sizeBytes: number, type = "application/pdf"): File {
  const content = new Uint8Array(Math.max(sizeBytes, 0));
  return new File([content], name, { type });
}

describe("validateFile", () => {
  it("accepts a valid PDF", () => {
    const file = makeFile("post.pdf", 1024, "application/pdf");
    expect(validateFile(file)).toBeNull();
  });

  it("accepts a valid PNG", () => {
    const file = makeFile("post.png", 1024, "image/png");
    expect(validateFile(file)).toBeNull();
  });

  it("accepts a valid JPG", () => {
    const file = makeFile("post.jpg", 1024, "image/jpeg");
    expect(validateFile(file)).toBeNull();
  });

  it("rejects an unsupported extension", () => {
    const file = makeFile("malware.exe", 1024, "application/x-msdownload");
    expect(validateFile(file)).toMatch(/unsupported file type/i);
  });

  it("rejects a file over the size limit", () => {
    const file = makeFile("huge.pdf", MAX_FILE_SIZE_BYTES + 1, "application/pdf");
    expect(validateFile(file)).toMatch(/20 MB size limit/i);
  });

  it("accepts a file exactly at the size limit", () => {
    const file = makeFile("max.pdf", MAX_FILE_SIZE_BYTES, "application/pdf");
    expect(validateFile(file)).toBeNull();
  });

  it("rejects an empty file", () => {
    const file = makeFile("empty.pdf", 0, "application/pdf");
    expect(validateFile(file)).toMatch(/empty/i);
  });

  it("rejects a file with no extension", () => {
    const file = makeFile("noextension", 1024, "application/pdf");
    expect(validateFile(file)).toMatch(/unsupported file type/i);
  });

  it("is case-insensitive about extension", () => {
    const file = makeFile("post.PDF", 1024, "application/pdf");
    expect(validateFile(file)).toBeNull();
  });
});
