"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { analyzeDocument, uploadDocument } from "@/lib/api";
import { getErrorMessage } from "@/lib/error-messages";
import { documentAnalysisQueryKey, documentQueryKey } from "@/hooks/use-document-analysis";
import type { AnalysisResponse, DocumentResponse, Platform } from "@/types/api";
import type { ProcessingStage } from "@/types/processing";

interface AnalyzeFlowResult {
  document: DocumentResponse;
  analysis: AnalysisResponse;
}

interface SubmitArgs {
  file: File;
  platform: Platform;
}

type Phase = "uploading" | "analyzing";

/** Orchestrates the two real, dependent API calls behind one user action:
 * upload (which also runs extraction server-side) then analyze. `stage`
 * reflects which of those two requests is actually in flight — it never
 * simulates progress that isn't real. `failedPhase` remembers which of
 * the two was in flight when an error occurred (`stage` itself becomes
 * the generic "error" value, which loses that information) so the UI can
 * show exactly how far the pipeline got before failing. */
export function useAnalyzeFlow() {
  const [stage, setStage] = useState<ProcessingStage>("idle");
  const [failedPhase, setFailedPhase] = useState<Phase | null>(null);
  const currentPhaseRef = useRef<Phase | null>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation<AnalyzeFlowResult, unknown, SubmitArgs>({
    mutationFn: async ({ file, platform }) => {
      currentPhaseRef.current = "uploading";
      setStage("uploading");
      const document = await uploadDocument(file);

      currentPhaseRef.current = "analyzing";
      setStage("analyzing");
      const analysis = await analyzeDocument(document.id, platform);

      return { document, analysis };
    },
    onSuccess: ({ document, analysis }) => {
      // Prime the results page's cache so navigating there is instant,
      // not another round-trip for data we already have.
      queryClient.setQueryData(documentQueryKey(document.id), document);
      queryClient.setQueryData(documentAnalysisQueryKey(document.id), analysis);
      setStage("complete");
    },
    onError: () => {
      setFailedPhase(currentPhaseRef.current);
      setStage("error");
    },
  });

  const reset = () => {
    setStage("idle");
    setFailedPhase(null);
    currentPhaseRef.current = null;
    mutation.reset();
  };

  return {
    stage,
    failedPhase,
    document: mutation.data?.document ?? null,
    analysis: mutation.data?.analysis ?? null,
    errorMessage: mutation.error ? getErrorMessage(mutation.error) : null,
    submit: mutation.mutate,
    isPending: mutation.isPending,
    reset,
  };
}
