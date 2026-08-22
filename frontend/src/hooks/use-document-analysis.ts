"use client";

import { useQuery } from "@tanstack/react-query";

import { getDocument, getDocumentAnalysis } from "@/lib/api";

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

  return {
    document: documentQuery.data,
    analysis: analysisQuery.data,
    isLoading: documentQuery.isLoading || (documentQuery.isSuccess && analysisQuery.isLoading),
    error: documentQuery.error ?? (documentQuery.isSuccess ? analysisQuery.error : null),
  };
}
