"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { listAnalyses, listDocuments } from "@/lib/api";
import type { DocumentSummary } from "@/types/api";

const HISTORY_FETCH_LIMIT = 200;

export interface HistoryRow extends DocumentSummary {
  overallScore: number | null;
}

/** Joins documents with their most recent analysis's score, client-side —
 * both lists already exist as separate endpoints, and history is a
 * document-centric view (every upload attempt, analyzed or not), not an
 * analysis-centric one. Fine at this data scale — see docs/decisions.md. */
export function useHistory() {
  const documentsQuery = useQuery({
    queryKey: ["documents", "history"],
    queryFn: () => listDocuments({ limit: HISTORY_FETCH_LIMIT }),
  });

  const analysesQuery = useQuery({
    queryKey: ["analyses", "history"],
    queryFn: () => listAnalyses({ limit: HISTORY_FETCH_LIMIT }),
  });

  const rows = useMemo<HistoryRow[]>(() => {
    const scoreByDocumentId = new Map<string, number>();
    // listAnalyses is ordered newest-first, so the first entry seen per
    // document is its most recent analysis.
    for (const analysis of analysesQuery.data ?? []) {
      if (!scoreByDocumentId.has(analysis.document_id)) {
        scoreByDocumentId.set(analysis.document_id, analysis.overall_score);
      }
    }
    return (documentsQuery.data ?? []).map((document) => ({
      ...document,
      overallScore: scoreByDocumentId.get(document.id) ?? null,
    }));
  }, [documentsQuery.data, analysesQuery.data]);

  return {
    rows,
    isLoading: documentsQuery.isLoading || analysesQuery.isLoading,
    error: documentsQuery.error ?? analysesQuery.error,
  };
}
