import { ApiError } from "@/lib/api";

/** Maps backend error codes to human-readable messages. Falls back to the
 * server's own message (never a stack trace — the backend already keeps
 * those out of the response) if a code isn't recognized. */
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_FILE_TYPE: "That file type isn't supported. Upload a PDF, PNG, or JPG.",
  FILE_TOO_LARGE: "That file is too large. The maximum size is 20 MB.",
  CORRUPTED_FILE: "That file appears to be corrupted or unreadable. Try a different file.",
  NO_TEXT_FOUND: "No readable text could be found in this document.",
  OCR_FAILED: "Text recognition (OCR) failed. The file may be low quality or unreadable.",
  AI_ANALYSIS_FAILED: "The AI analysis service is temporarily unavailable. Try again shortly.",
  AI_RATE_LIMITED:
    "The AI service is busy right now (rate limit reached). Wait about a minute, then try again.",
  INVALID_AI_RESPONSE: "The AI returned an unexpected response. Try again.",
  DATABASE_ERROR: "A server error occurred. Try again shortly.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  NETWORK_ERROR:
    "Couldn't reach the analysis server. It may be waking up from idle — wait a moment and try again.",
  UNKNOWN_ERROR: "Something went wrong. Please try again.",
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return ERROR_MESSAGES[error.errorCode] ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong. Please try again.";
}
