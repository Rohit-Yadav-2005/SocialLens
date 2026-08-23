import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAnalyzeFlow } from "./use-analyze-flow";
import { ApiError } from "@/lib/api";
import type { AnalysisResponse, DocumentResponse } from "@/types/api";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    uploadDocument: vi.fn(),
    analyzeDocument: vi.fn(),
  };
});

import { analyzeDocument, uploadDocument } from "@/lib/api";

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const FILE = new File(["content"], "post.pdf", { type: "application/pdf" });
const DOCUMENT = { id: "doc-1", filename: "post.pdf" } as DocumentResponse;
const ANALYSIS = { id: "an-1", document_id: "doc-1", overall_score: 80 } as AnalysisResponse;

describe("useAnalyzeFlow", () => {
  beforeEach(() => {
    vi.mocked(uploadDocument).mockReset();
    vi.mocked(analyzeDocument).mockReset();
  });

  it("tracks failedPhase as 'uploading' when the upload call itself fails", async () => {
    vi.mocked(uploadDocument).mockRejectedValue(
      new ApiError("FILE_TOO_LARGE", "File exceeds the 20MB size limit.", 400),
    );

    const { result } = renderHook(() => useAnalyzeFlow(), { wrapper: createWrapper() });

    act(() => {
      result.current.submit({ file: FILE, platform: "generic" });
    });

    await waitFor(() => expect(result.current.stage).toBe("error"));
    expect(result.current.failedPhase).toBe("uploading");
    expect(analyzeDocument).not.toHaveBeenCalled();
  });

  it("tracks failedPhase as 'analyzing' when upload succeeds but analyze fails", async () => {
    vi.mocked(uploadDocument).mockResolvedValue(DOCUMENT);
    vi.mocked(analyzeDocument).mockRejectedValue(
      new ApiError("AI_ANALYSIS_FAILED", "Gemini request failed.", 502),
    );

    const { result } = renderHook(() => useAnalyzeFlow(), { wrapper: createWrapper() });

    act(() => {
      result.current.submit({ file: FILE, platform: "generic" });
    });

    await waitFor(() => expect(result.current.stage).toBe("error"));
    expect(result.current.failedPhase).toBe("analyzing");
  });

  it("reaches 'complete' and exposes both the document and the analysis on success", async () => {
    vi.mocked(uploadDocument).mockResolvedValue(DOCUMENT);
    vi.mocked(analyzeDocument).mockResolvedValue(ANALYSIS);

    const { result } = renderHook(() => useAnalyzeFlow(), { wrapper: createWrapper() });

    act(() => {
      result.current.submit({ file: FILE, platform: "linkedin" });
    });

    await waitFor(() => expect(result.current.stage).toBe("complete"));
    expect(result.current.document).toEqual(DOCUMENT);
    expect(result.current.analysis).toEqual(ANALYSIS);
    expect(analyzeDocument).toHaveBeenCalledWith("doc-1", "linkedin");
  });

  it("reset() clears stage, failedPhase, and the underlying mutation state", async () => {
    vi.mocked(uploadDocument).mockRejectedValue(
      new ApiError("NETWORK_ERROR", "Couldn't reach the server.", 0),
    );

    const { result } = renderHook(() => useAnalyzeFlow(), { wrapper: createWrapper() });

    act(() => {
      result.current.submit({ file: FILE, platform: "generic" });
    });
    await waitFor(() => expect(result.current.stage).toBe("error"));

    act(() => {
      result.current.reset();
    });

    expect(result.current.stage).toBe("idle");
    expect(result.current.failedPhase).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });
});
