import { ContentComparison } from "@/components/analysis/content-comparison";
import { DeterministicMetrics } from "@/components/analysis/deterministic-metrics";
import { OverallScoreCard } from "@/components/analysis/overall-score-card";
import { Recommendations } from "@/components/analysis/recommendations";
import { ScoreBreakdown } from "@/components/analysis/score-breakdown";
import { StrengthsList, WeaknessesList } from "@/components/analysis/strengths-weaknesses";
import { Badge } from "@/components/ui/badge";
import type { AnalysisResponse, DocumentResponse } from "@/types/api";

interface ResultsDashboardProps {
  document: DocumentResponse;
  analysis: AnalysisResponse;
}

export function ResultsDashboard({ document, analysis }: ResultsDashboardProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="animate-fade-up flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
            Report
          </p>
          <h1 className="font-display mt-2.5 text-3xl font-medium sm:text-4xl">
            Analysis results
          </h1>
          <p className="mt-2 truncate text-sm text-muted-foreground" title={document.filename}>
            {document.filename}
          </p>
        </div>
        {document.extraction_method && (
          <Badge variant="outline" className="capitalize">
            {document.extraction_method === "ocr" ? "Extracted via OCR" : "Native text extraction"}
            {document.ocr_confidence !== null &&
              ` · ${Math.round(document.ocr_confidence)}% confidence`}
          </Badge>
        )}
      </div>

      <OverallScoreCard
        score={analysis.overall_score}
        tone={analysis.tone}
        sentiment={analysis.sentiment}
        targetAudience={analysis.target_audience}
      />

      <ScoreBreakdown analysis={analysis} />

      <DeterministicMetrics metrics={analysis.metrics} />

      <div className="grid gap-5 sm:grid-cols-2">
        <StrengthsList items={analysis.strengths} />
        <WeaknessesList items={analysis.weaknesses} />
      </div>

      <Recommendations items={analysis.recommendations} />

      <ContentComparison
        originalContent={document.extracted_text ?? ""}
        improvedContent={analysis.improved_content}
      />
    </div>
  );
}
