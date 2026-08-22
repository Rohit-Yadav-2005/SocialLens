export type DocumentStatus =
  | "uploaded"
  | "processing"
  | "processed"
  | "analyzing"
  | "analyzed"
  | "failed";

export type ExtractionMethod = "native" | "ocr";

export type Platform = "linkedin" | "instagram" | "twitter" | "generic";

export interface DocumentResponse {
  id: string;
  filename: string;
  original_file_type: string;
  file_size: number;
  status: DocumentStatus;
  extraction_method: ExtractionMethod | null;
  extracted_text: string | null;
  ocr_confidence: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentSummary {
  id: string;
  filename: string;
  original_file_type: string;
  file_size: number;
  status: DocumentStatus;
  created_at: string;
}

/** Mirrors the backend's ContentMetricsSchema — deterministic counts
 * computed independently of the LLM. */
export interface ContentMetrics {
  word_count: number;
  char_count: number;
  sentence_count: number;
  avg_sentence_length: number;
  hashtag_count: number;
  mention_count: number;
  url_count: number;
  emoji_count: number;
  question_count: number;
  has_cta: boolean;
  paragraph_count: number;
  readability_score: number;
}

export interface AnalysisResponse {
  id: string;
  document_id: string;
  overall_score: number;
  hook_score: number;
  clarity_score: number;
  engagement_score: number;
  cta_score: number;
  readability_score: number;
  tone: string;
  sentiment: string;
  target_audience: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  improved_content: string;
  metrics: ContentMetrics;
  created_at: string;
}

export interface AnalysisSummary {
  id: string;
  document_id: string;
  overall_score: number;
  created_at: string;
}

/** Shape of every error response returned by the backend's global exception handlers. */
export interface ApiErrorBody {
  error_code: string;
  message: string;
}
