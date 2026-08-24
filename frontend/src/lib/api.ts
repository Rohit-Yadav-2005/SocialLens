import type {
  AnalysisResponse,
  AnalysisSummary,
  ApiErrorBody,
  DocumentResponse,
  DocumentSummary,
  InsightsResponse,
  Platform,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody> {
  try {
    const body = await response.json();
    if (typeof body?.error_code === "string" && typeof body?.message === "string") {
      return body as ApiErrorBody;
    }
  } catch {
    // response body wasn't JSON (or wasn't the shape we expect) — fall through
  }
  return { error_code: "UNKNOWN_ERROR", message: "Something went wrong. Please try again." };
}

function buildPageParams(params?: { skip?: number; limit?: number }): string {
  const query = new URLSearchParams();
  if (params?.skip !== undefined) query.set("skip", String(params.skip));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  const suffix = query.toString();
  return suffix ? `?${suffix}` : "";
}

/** Wait for the backend to be reachable before sending a request we can't
 * safely retry.
 *
 * The deployed API runs on a tier that spins down when idle and swaps
 * containers on deploy, so the first request after a quiet period either
 * hangs for ~30s while the instance boots or fails outright mid-swap. That
 * surfaced to users as "couldn't reach the server" on the upload POST —
 * a request we must not blindly retry, since a retry could duplicate a
 * document the server had in fact already accepted.
 *
 * Absorbing the wait on an idempotent GET instead is safe to repeat and
 * costs one fast round-trip when the server is already warm. If it never
 * comes up we return anyway and let the real request produce the error,
 * so the user sees the actual failure rather than one invented here.
 */
async function waitForBackend(attempts = 3, delayMs = 2000): Promise<void> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/health`);
      if (response.ok) return;
    } catch {
      // Not reachable yet — fall through to the backoff below.
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Couldn't reach the analysis server. It may be waking up from idle — wait a moment and try again.",
      0,
    );
  }

  if (!response.ok) {
    const body = await parseErrorBody(response);
    throw new ApiError(body.error_code, body.message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export async function uploadDocument(file: File): Promise<DocumentResponse> {
  // First request of the flow, and the one that must not be auto-retried.
  await waitForBackend();

  const formData = new FormData();
  formData.append("file", file);
  return request<DocumentResponse>("/api/v1/documents", {
    method: "POST",
    body: formData,
  });
}

export function analyzeDocument(
  documentId: string,
  platform: Platform = "generic",
): Promise<AnalysisResponse> {
  return request<AnalysisResponse>(
    `/api/v1/documents/${encodeURIComponent(documentId)}/analyze?platform=${platform}`,
    { method: "POST" },
  );
}

export function getDocument(documentId: string): Promise<DocumentResponse> {
  return request<DocumentResponse>(`/api/v1/documents/${encodeURIComponent(documentId)}`);
}

/** The most recent analysis for a document. Throws ApiError("NOT_FOUND")
 * if the document doesn't exist or hasn't been analyzed yet. */
export function getDocumentAnalysis(documentId: string): Promise<AnalysisResponse> {
  return request<AnalysisResponse>(
    `/api/v1/documents/${encodeURIComponent(documentId)}/analysis`,
  );
}

export function listDocuments(params?: {
  skip?: number;
  limit?: number;
}): Promise<DocumentSummary[]> {
  return request<DocumentSummary[]>(`/api/v1/documents${buildPageParams(params)}`);
}

export function getAnalysis(analysisId: string): Promise<AnalysisResponse> {
  return request<AnalysisResponse>(`/api/v1/analyses/${encodeURIComponent(analysisId)}`);
}

export function listAnalyses(params?: {
  skip?: number;
  limit?: number;
}): Promise<AnalysisSummary[]> {
  return request<AnalysisSummary[]>(`/api/v1/analyses${buildPageParams(params)}`);
}

export function getInsights(): Promise<InsightsResponse> {
  return request<InsightsResponse>("/api/v1/insights");
}
