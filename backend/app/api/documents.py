from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.providers.llm.base import Platform
from app.schemas.analysis import AnalysisResponse
from app.schemas.document import DocumentResponse, DocumentSummary
from app.services.analysis_service import AnalysisService
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    file_bytes = await file.read()
    service = DocumentService(db)
    document = service.upload(
        filename=file.filename or "upload",
        content_type=file.content_type or "application/octet-stream",
        file_bytes=file_bytes,
    )
    return DocumentResponse.model_validate(document)


@router.get("", response_model=list[DocumentSummary])
def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[DocumentSummary]:
    service = DocumentService(db)
    documents = service.list(skip=skip, limit=limit)
    return [DocumentSummary.model_validate(d) for d in documents]


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db)) -> DocumentResponse:
    service = DocumentService(db)
    document = service.get(document_id)
    return DocumentResponse.model_validate(document)


@router.post(
    "/{document_id}/analyze", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED
)
def analyze_document(
    document_id: str,
    platform: Platform = Query("generic"),
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    document = DocumentService(db).get(document_id)
    analysis = AnalysisService(db).analyze_document(document, platform=platform)
    return AnalysisResponse.model_validate(analysis)
