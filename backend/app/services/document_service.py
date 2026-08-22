"""Document upload orchestration: validate, persist to temp storage, record in DB.

Extraction (native text / OCR) is a separate phase of the pipeline and
lives in ExtractionService — this service only owns getting a validated
file safely onto disk and into the documents table.
"""

from pathlib import Path

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import NotFoundError
from app.models.document import Document
from app.repositories.document_repository import DocumentRepository
from app.utils.file_validation import extension_of, validate_upload


class DocumentService:
    def __init__(self, db: Session):
        self.repo = DocumentRepository(db)
        self.settings = get_settings()

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
        return document

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
