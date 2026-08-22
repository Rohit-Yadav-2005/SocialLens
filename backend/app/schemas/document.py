"""Request/response schemas for the documents API."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.document import DocumentStatus, ExtractionMethod


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    original_file_type: str
    file_size: int
    status: DocumentStatus
    extraction_method: ExtractionMethod | None
    extracted_text: str | None
    ocr_confidence: float | None
    error_message: str | None
    created_at: datetime
    updated_at: datetime


class DocumentSummary(BaseModel):
    """Lighter payload for list views (history page)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    filename: str
    original_file_type: str
    file_size: int
    status: DocumentStatus
    created_at: datetime
