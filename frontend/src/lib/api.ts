import type {
  AnalysisResponse,
  AnalysisSummary,
  ApiErrorBody,
  DocumentResponse,
  DocumentSummary,
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

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, init);
  } catch {
    throw new ApiError(
      "NETWORK_ERROR",
      "Couldn't reach the server. Check that the backend is running and try again.",
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

export function uploadDocument(file: File): Promise<DocumentResponse> {
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
    `/api/v1/documents/${documentId}/analyze?platform=${platform}`,
    { method: "POST" },
  );
}

export function getDocument(documentId: string): Promise<DocumentResponse> {
  return request<DocumentResponse>(`/api/v1/documents/${documentId}`);
}

/** The most recent analysis for a document. Throws ApiError("NOT_FOUND")
 * if the document doesn't exist or hasn't been analyzed yet. */
export function getDocumentAnalysis(documentId: string): Promise<AnalysisResponse> {
  return request<AnalysisResponse>(`/api/v1/documents/${documentId}/analysis`);
}

export function listDocuments(params?: {
  skip?: number;
  limit?: number;
}): Promise<DocumentSummary[]> {
  const query = new URLSearchParams();
  if (params?.skip !== undefined) query.set("skip", String(params.skip));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<DocumentSummary[]>(`/api/v1/documents${suffix}`);
}

export function getAnalysis(analysisId: string): Promise<AnalysisResponse> {
  return request<AnalysisResponse>(`/api/v1/analyses/${analysisId}`);
}

export function listAnalyses(params?: {
  skip?: number;
  limit?: number;
}): Promise<AnalysisSummary[]> {
  const query = new URLSearchParams();
  if (params?.skip !== undefined) query.set("skip", String(params.skip));
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<AnalysisSummary[]>(`/api/v1/analyses${suffix}`);
}
