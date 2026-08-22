"""Application-level exceptions.

Each exception carries a stable `error_code` that the frontend maps to a
human-readable message. Never leak stack traces or internals in `message`;
detailed diagnostics belong in the server logs, not the API response.
"""

from fastapi import status


class AppError(Exception):
    error_code: str = "UNKNOWN_ERROR"
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR

    def __init__(
        self, message: str, *, error_code: str | None = None, status_code: int | None = None
    ):
        self.message = message
        if error_code:
            self.error_code = error_code
        if status_code:
            self.status_code = status_code
        super().__init__(message)


class InvalidFileTypeError(AppError):
    error_code = "INVALID_FILE_TYPE"
    status_code = status.HTTP_400_BAD_REQUEST


class FileTooLargeError(AppError):
    error_code = "FILE_TOO_LARGE"
    status_code = status.HTTP_400_BAD_REQUEST


class CorruptedFileError(AppError):
    error_code = "CORRUPTED_FILE"
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT


class NoTextFoundError(AppError):
    error_code = "NO_TEXT_FOUND"
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT


class OcrFailedError(AppError):
    error_code = "OCR_FAILED"
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT


class AiAnalysisFailedError(AppError):
    error_code = "AI_ANALYSIS_FAILED"
    status_code = status.HTTP_502_BAD_GATEWAY


class InvalidAiResponseError(AppError):
    error_code = "INVALID_AI_RESPONSE"
    status_code = status.HTTP_502_BAD_GATEWAY


class DatabaseError(AppError):
    error_code = "DATABASE_ERROR"
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR


class NotFoundError(AppError):
    error_code = "NOT_FOUND"
    status_code = status.HTTP_404_NOT_FOUND
