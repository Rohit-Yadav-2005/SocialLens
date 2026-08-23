"use client";

import { Sparkles } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { documentAnalysisQueryKey } from "@/hooks/use-document-analysis";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import { analyzeDocument } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-messages";
import type { DocumentResponse } from "@/types/api";

interface NotAnalyzedYetProps {
  document: DocumentResponse;
}

/** Shown on the results page for a document that loaded fine but hasn't
 * been analyzed yet (or whose last analysis failed) — reachable from any
 * History row, since every upload shows up there regardless of status.
 * Analyzes right here instead of dead-ending on a generic error (see
 * docs/decisions.md). Defaults to the generic platform, matching what a
 * direct re-analyze from this page (rather than the main upload flow)
 * reasonably assumes. */
export function NotAnalyzedYet({ document }: NotAnalyzedYetProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => analyzeDocument(document.id, "generic"),
    onSuccess: (analysis) => {
      queryClient.setQueryData(documentAnalysisQueryKey(document.id), analysis);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  return (
    <EmptyState
      icon={Sparkles}
      title="Not analyzed yet"
      description={`"${document.filename}" has been uploaded but hasn't been analyzed. Run an analysis to see its score and recommendations.`}
      action={
        <Button
          size="lg"
          className="h-11 px-6"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Analyzing…" : "Analyze this document"}
        </Button>
      }
    />
  );
}
