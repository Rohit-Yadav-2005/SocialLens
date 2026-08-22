"""Document upload orchestration: validate, persist to temp storage,
extract text (native or OCR via ExtractionService), and record the
outcome in the DB. The original file is deleted once processing finishes,
success or failure — see docs/decisions.md.
"""

from pathlib import Path

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppError, NotFoundError
from app.models.document import Document, DocumentStatus
from app.repositories.document_repository import DocumentRepository
from app.services.extraction_service import ExtractionService
from app.utils.file_validation import extension_of, validate_upload


class DocumentService:
    def __init__(self, db: Session, extraction_service: ExtractionService | None = None):
        self.repo = DocumentRepository(db)
        self.settings = get_settings()
        self.extraction_service = extraction_service or ExtractionService()

    def upload(self, *, filename: str, content_type: str, file_bytes: bytes) -> Document:
        validated = validate_upload(
            filename=filename,
            content_type=content_type,
            file_bytes=file_bytes,
            max_size_bytes=self.settings.max_upload_size_bytes,
        )
        document = self.repo.create(
            filename=filename,
            original_file_type=validated.content_type,
            file_size=len(file_bytes),
        )

        temp_path = self.temp_path_for(document)
        temp_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path.write_bytes(file_bytes)

        try:
            result = self.extraction_service.extract(temp_path, validated.content_type)
        except AppError as exc:
            self.repo.update_status(
                document, status=DocumentStatus.FAILED, error_message=exc.message
            )
            raise
        finally:
            temp_path.unlink(missing_ok=True)

        return self.repo.update_extraction(
            document,
            extracted_text=result.text,
            extraction_method=result.method,
            ocr_confidence=result.confidence,
        )

    def get(self, document_id: str) -> Document:
        document = self.repo.get(document_id)
        if document is None:
            raise NotFoundError(f"Document '{document_id}' not found.")
        return document

    def list(self, *, skip: int = 0, limit: int = 50) -> list[Document]:
        return self.repo.list(skip=skip, limit=limit)

    def temp_path_for(self, document: Document) -> Path:
        extension = extension_of(document.filename)
        return self.settings.temp_dir / f"{document.id}{extension}"
