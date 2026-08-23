import { describe, expect, it } from "vitest";

import { ApiError } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-messages";

describe("getErrorMessage", () => {
  it("maps a known error code to its human-readable message", () => {
    const error = new ApiError("FILE_TOO_LARGE", "raw backend message", 400);
    expect(getErrorMessage(error)).toBe(
      "That file is too large. The maximum size is 20 MB.",
    );
  });

  it("maps every documented backend error code to a non-empty message", () => {
    const codes = [
      "INVALID_FILE_TYPE",
      "FILE_TOO_LARGE",
      "CORRUPTED_FILE",
      "NO_TEXT_FOUND",
      "OCR_FAILED",
      "AI_ANALYSIS_FAILED",
      "INVALID_AI_RESPONSE",
      "DATABASE_ERROR",
      "NOT_FOUND",
      "NETWORK_ERROR",
      "UNKNOWN_ERROR",
    ];
    for (const code of codes) {
      const message = getErrorMessage(new ApiError(code, "raw", 500));
      expect(message.length).toBeGreaterThan(0);
      expect(message).not.toBe(code);
    }
  });

  it("falls back to the server's own message for an unrecognized error code", () => {
    const error = new ApiError("SOME_NEW_CODE_NOT_YET_MAPPED", "a specific server message", 500);
    expect(getErrorMessage(error)).toBe("a specific server message");
  });

  it("never leaks a raw error code as the displayed message", () => {
    const error = new ApiError("FILE_TOO_LARGE", "raw", 400);
    expect(getErrorMessage(error)).not.toContain("FILE_TOO_LARGE");
  });

  it("falls back to a generic message for a plain Error", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("falls back to a generic message for a non-Error thrown value", () => {
    expect(getErrorMessage("just a string")).toBe("Something went wrong. Please try again.");
    expect(getErrorMessage(undefined)).toBe("Something went wrong. Please try again.");
  });
});
