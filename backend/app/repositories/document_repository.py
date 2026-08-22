"""Data-access layer for Document rows. No business logic here."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document, DocumentStatus, ExtractionMethod


class DocumentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, *, filename: str, original_file_type: str, file_size: int) -> Document:
        document = Document(
            filename=filename,
            original_file_type=original_file_type,
            file_size=file_size,
            status=DocumentStatus.UPLOADED,
        )
        self.db.add(document)
        self.db.commit()
        self.db.refresh(document)
        return document

    def get(self, document_id: str) -> Document | None:
        return self.db.get(Document, document_id)

    def list(self, *, skip: int = 0, limit: int = 50) -> list[Document]:
        stmt = select(Document).order_by(Document.created_at.desc()).offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def update_status(
        self, document: Document, *, status: DocumentStatus, error_message: str | None = None
    ) -> Document:
        document.status = status
        document.error_message = error_message
        self.db.commit()
        self.db.refresh(document)
        return document

    def update_extraction(
        self,
        document: Document,
        *,
        extracted_text: str,
        extraction_method: ExtractionMethod,
        ocr_confidence: float | None = None,
        status: DocumentStatus = DocumentStatus.PROCESSED,
    ) -> Document:
        document.extracted_text = extracted_text
        document.extraction_method = extraction_method
        document.ocr_confidence = ocr_confidence
        document.status = status
        self.db.commit()
        self.db.refresh(document)
        return document

    def delete(self, document: Document) -> None:
        self.db.delete(document)
        self.db.commit()
