"use client";

import { use } from "react";

import { ResultsDashboard } from "@/components/analysis/results-dashboard";
import { ResultsError } from "@/components/analysis/results-error";
import { ResultsSkeleton } from "@/components/analysis/results-skeleton";
import { useDocumentAnalysis } from "@/hooks/use-document-analysis";
import { getErrorMessage } from "@/lib/error-messages";

export default function ResultsPage(props: PageProps<"/analyze/[documentId]">) {
  const { documentId } = use(props.params);
  const { document, analysis, isLoading, error } = useDocumentAnalysis(documentId);

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {isLoading && <ResultsSkeleton />}
      {!isLoading && error && <ResultsError message={getErrorMessage(error)} />}
      {!isLoading && !error && document && analysis && (
        <ResultsDashboard document={document} analysis={analysis} />
      )}
    </div>
  );
}
