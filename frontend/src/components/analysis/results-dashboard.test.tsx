import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResultsDashboard } from "./results-dashboard";
import type { AnalysisResponse, DocumentResponse } from "@/types/api";

const DOCUMENT: DocumentResponse = {
  id: "doc-1",
  filename: "launch-announcement.pdf",
  original_file_type: "application/pdf",
  file_size: 1024,
  status: "analyzed",
  extraction_method: "native",
  extracted_text: "Just launched our biggest product update yet! #ProductLaunch",
  ocr_confidence: null,
  error_message: null,
  created_at: "2026-08-22T10:00:00Z",
  updated_at: "2026-08-22T10:00:00Z",
};

const ANALYSIS: AnalysisResponse = {
  id: "analysis-1",
  document_id: "doc-1",
  overall_score: 84,
  hook_score: 90,
  clarity_score: 88,
  engagement_score: 75,
  cta_score: 60,
  readability_score: 92,
  tone: "professional",
  sentiment: "positive",
  target_audience: "B2B marketers",
  strengths: ["Clear value proposition", "Strong opening hook"],
  weaknesses: ["The call to action could be more specific"],
  recommendations: ["Add a direct link or next step for readers"],
  improved_content: "We just launched our biggest update yet — here's what's new.",
  metrics: {
    word_count: 42,
    char_count: 250,
    sentence_count: 4,
    avg_sentence_length: 10.5,
    hashtag_count: 1,
    mention_count: 0,
    url_count: 0,
    emoji_count: 0,
    question_count: 0,
    has_cta: true,
    paragraph_count: 1,
    readability_score: 92,
  },
  created_at: "2026-08-22T10:05:00Z",
};

describe("ResultsDashboard", () => {
  it("renders the document filename and overall score", () => {
    render(<ResultsDashboard document={DOCUMENT} analysis={ANALYSIS} />);

    expect(screen.getByText("launch-announcement.pdf")).toBeInTheDocument();
    expect(screen.getByText("84")).toBeInTheDocument();
  });

  it("renders tone, sentiment, and target audience", () => {
    render(<ResultsDashboard document={DOCUMENT} analysis={ANALYSIS} />);

    expect(screen.getByText(/professional tone/i)).toBeInTheDocument();
    expect(screen.getByText("positive")).toBeInTheDocument();
    expect(screen.getByText("B2B marketers")).toBeInTheDocument();
  });

  it("renders every strength, weakness, and recommendation", () => {
    render(<ResultsDashboard document={DOCUMENT} analysis={ANALYSIS} />);

    expect(screen.getByText("Clear value proposition")).toBeInTheDocument();
    expect(screen.getByText("Strong opening hook")).toBeInTheDocument();
    expect(screen.getByText("The call to action could be more specific")).toBeInTheDocument();
    expect(
      screen.getByText("Add a direct link or next step for readers"),
    ).toBeInTheDocument();
  });

  it("renders the deterministic metrics from real data, not recomputed client-side", () => {
    render(<ResultsDashboard document={DOCUMENT} analysis={ANALYSIS} />);

    expect(screen.getByText("42")).toBeInTheDocument(); // word_count
    expect(screen.getByText("250")).toBeInTheDocument(); // char_count
    expect(screen.getByText("Detected")).toBeInTheDocument(); // has_cta
  });

  it("renders both the original extracted text and the AI-improved rewrite", () => {
    render(<ResultsDashboard document={DOCUMENT} analysis={ANALYSIS} />);

    expect(
      screen.getByText("Just launched our biggest product update yet! #ProductLaunch"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("We just launched our biggest update yet — here's what's new."),
    ).toBeInTheDocument();
  });

  it("shows the extraction method badge", () => {
    render(<ResultsDashboard document={DOCUMENT} analysis={ANALYSIS} />);
    expect(screen.getByText(/native text extraction/i)).toBeInTheDocument();
  });

  it("shows OCR confidence when extraction used OCR", () => {
    const ocrDocument: DocumentResponse = {
      ...DOCUMENT,
      extraction_method: "ocr",
      ocr_confidence: 87.4,
    };
    render(<ResultsDashboard document={ocrDocument} analysis={ANALYSIS} />);
    expect(screen.getByText(/extracted via ocr/i)).toBeInTheDocument();
    expect(screen.getByText(/87% confidence/)).toBeInTheDocument();
  });

  it("shows an empty-state message instead of blank space when there are no weaknesses", () => {
    const noWeaknesses: AnalysisResponse = { ...ANALYSIS, weaknesses: [] };
    render(<ResultsDashboard document={DOCUMENT} analysis={noWeaknesses} />);
    expect(screen.getByText(/no specific weaknesses were identified/i)).toBeInTheDocument();
  });
});
