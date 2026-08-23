import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useHistory } from "./use-history";
import type { AnalysisSummary, DocumentSummary } from "@/types/api";

vi.mock("@/lib/api");

import { listAnalyses, listDocuments } from "@/lib/api";

function createWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

function document(overrides: Partial<DocumentSummary> = {}): DocumentSummary {
  return {
    id: "doc-1",
    filename: "post.pdf",
    original_file_type: "application/pdf",
    file_size: 1024,
    status: "analyzed",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function analysis(overrides: Partial<AnalysisSummary> = {}): AnalysisSummary {
  return {
    id: "an-1",
    document_id: "doc-1",
    overall_score: 80,
    created_at: "2026-01-01T00:05:00Z",
    ...overrides,
  };
}

describe("useHistory", () => {
  beforeEach(() => {
    vi.mocked(listDocuments).mockReset();
    vi.mocked(listAnalyses).mockReset();
  });

  it("joins each document with its most recent analysis score", async () => {
    vi.mocked(listDocuments).mockResolvedValue([
      document({ id: "doc-1" }),
      document({ id: "doc-2" }),
    ]);
    vi.mocked(listAnalyses).mockResolvedValue([
      analysis({ id: "an-2", document_id: "doc-2", overall_score: 91 }),
      analysis({ id: "an-1", document_id: "doc-1", overall_score: 70 }),
    ]);

    const { result } = renderHook(() => useHistory(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rows.find((r) => r.id === "doc-1")?.overallScore).toBe(70);
    expect(result.current.rows.find((r) => r.id === "doc-2")?.overallScore).toBe(91);
  });

  it("gives a null overallScore to a document with no analysis yet", async () => {
    vi.mocked(listDocuments).mockResolvedValue([document({ id: "doc-1", status: "processed" })]);
    vi.mocked(listAnalyses).mockResolvedValue([]);

    const { result } = renderHook(() => useHistory(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rows[0].overallScore).toBeNull();
  });

  it("uses the most recent analysis when a document was re-analyzed", async () => {
    // listAnalyses is newest-first — the re-analysis (an-2) comes before
    // the original (an-1) in the response, exactly like the real API.
    vi.mocked(listDocuments).mockResolvedValue([document({ id: "doc-1" })]);
    vi.mocked(listAnalyses).mockResolvedValue([
      analysis({ id: "an-2", document_id: "doc-1", overall_score: 95 }),
      analysis({ id: "an-1", document_id: "doc-1", overall_score: 40 }),
    ]);

    const { result } = renderHook(() => useHistory(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.rows[0].overallScore).toBe(95);
  });

  it("surfaces an error from either the documents or the analyses request", async () => {
    vi.mocked(listDocuments).mockResolvedValue([]);
    vi.mocked(listAnalyses).mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useHistory(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
