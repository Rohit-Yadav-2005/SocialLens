import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  analyzeDocument,
  getDocument,
  listAnalyses,
  listDocuments,
  uploadDocument,
} from "@/lib/api";

function mockFetchOnce(response: Partial<Response> & { json?: () => Promise<unknown> }) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    ...response,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("request (via the exported API functions)", () => {
  it("returns the parsed JSON body on a successful response", async () => {
    mockFetchOnce({
      ok: true,
      status: 200,
      json: async () => ({ id: "doc-1", filename: "post.pdf" }),
    });

    const result = await getDocument("doc-1");

    expect(result).toEqual({ id: "doc-1", filename: "post.pdf" });
  });

  it("throws ApiError with the backend's error_code, message, and status on a non-ok response", async () => {
    mockFetchOnce({
      ok: false,
      status: 404,
      json: async () => ({ error_code: "NOT_FOUND", message: "Document 'x' not found." }),
    });

    await expect(getDocument("x")).rejects.toMatchObject({
      errorCode: "NOT_FOUND",
      message: "Document 'x' not found.",
      status: 404,
    });
  });

  it("throws ApiError instances specifically, not a generic Error", async () => {
    mockFetchOnce({
      ok: false,
      status: 500,
      json: async () => ({ error_code: "DATABASE_ERROR", message: "boom" }),
    });

    await expect(getDocument("x")).rejects.toBeInstanceOf(ApiError);
  });

  it("falls back to UNKNOWN_ERROR when the error response body isn't the expected shape", async () => {
    mockFetchOnce({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError("not json");
      },
    });

    await expect(getDocument("x")).rejects.toMatchObject({
      errorCode: "UNKNOWN_ERROR",
    });
  });

  it("throws NETWORK_ERROR when fetch itself rejects (server unreachable)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(getDocument("x")).rejects.toMatchObject({
      errorCode: "NETWORK_ERROR",
      status: 0,
    });
  });
});

describe("uploadDocument", () => {
  it("sends a multipart FormData body via POST", async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: "doc-1" }),
    });
    const file = new File(["content"], "post.pdf", { type: "application/pdf" });

    await uploadDocument(file);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/api/v1/documents");
    expect(init.method).toBe("POST");
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.body.get("file")).toBe(file);
  });
});

describe("analyzeDocument", () => {
  it("defaults to the generic platform", async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 201, json: async () => ({}) });

    await analyzeDocument("doc-1");

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("/documents/doc-1/analyze?platform=generic");
  });

  it("passes through a specific platform", async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 201, json: async () => ({}) });

    await analyzeDocument("doc-1", "linkedin");

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("platform=linkedin");
  });
});

describe("listDocuments / listAnalyses pagination params", () => {
  it("omits query params entirely when none are given", async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 200, json: async () => [] });

    await listDocuments();

    const [url] = fetchMock.mock.calls[0];
    expect(url).not.toContain("?");
  });

  it("includes skip and limit when provided", async () => {
    const fetchMock = mockFetchOnce({ ok: true, status: 200, json: async () => [] });

    await listAnalyses({ skip: 10, limit: 25 });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toContain("skip=10");
    expect(url).toContain("limit=25");
  });
});
