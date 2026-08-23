"use client";

import { useQuery } from "@tanstack/react-query";

import { ApiError, getDocument, getDocumentAnalysis } from "@/lib/api";

export function documentQueryKey(documentId: string) {
  return ["document", documentId] as const;
}

export function documentAnalysisQueryKey(documentId: string) {
  return ["document-analysis", documentId] as const;
}

/** Fetches a document and its most recent analysis by document id alone —
 * what the results page (`/analyze/[documentId]`) needs, whether it got
 * there via a fresh analyze or a direct/reloaded visit. */
export function useDocumentAnalysis(documentId: string) {
  const documentQuery = useQuery({
    queryKey: documentQueryKey(documentId),
    queryFn: () => getDocument(documentId),
  });

  const analysisQuery = useQuery({
    queryKey: documentAnalysisQueryKey(documentId),
    queryFn: () => getDocumentAnalysis(documentId),
    enabled: documentQuery.isSuccess,
  });

  // The document itself loaded fine, but it just hasn't been analyzed
  // yet (or an earlier analysis failed) — a real, expected state to land
  // in from History, distinct from an actual load error. Callers should
  // offer to analyze it, not show a generic "couldn't load" message.
  const analysisNotFound =
    documentQuery.isSuccess &&
    analysisQuery.isError &&
    analysisQuery.error instanceof ApiError &&
    analysisQuery.error.errorCode === "NOT_FOUND";

  return {
    document: documentQuery.data,
    analysis: analysisQuery.data,
    isLoading: documentQuery.isLoading || (documentQuery.isSuccess && analysisQuery.isLoading),
    error: analysisNotFound
      ? null
      : (documentQuery.error ?? (documentQuery.isSuccess ? analysisQuery.error : null)),
    analysisNotFound,
  };
}
