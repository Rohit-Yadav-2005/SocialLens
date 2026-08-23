from fastapi import APIRouter, Depends, File, Query, Request, UploadFile, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.exceptions import FileTooLargeError
from app.core.rate_limit import analyze_rate_limiter, upload_rate_limiter
from app.providers.llm.base import Platform
from app.schemas.analysis import AnalysisResponse
from app.schemas.document import DocumentResponse, DocumentSummary
from app.services.analysis_service import AnalysisService
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(upload_rate_limiter)],
)
async def upload_document(
    request: Request,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    """Upload a PDF/PNG/JPG (multipart) and extract its text synchronously
    (native extraction with automatic OCR fallback) before responding.
    Returns the document with `extracted_text` and `status` — `processed`
    on success, `failed` with `error_message` set if extraction couldn't
    produce usable text."""
    settings = get_settings()
    max_size = settings.max_upload_size_bytes

    # Reject oversized uploads as early as possible. A well-behaved
    # client sends Content-Length, so this rejects before reading any of
    # the body at all. As a backstop for clients that don't (e.g.
    # chunked transfer encoding), read one byte past the limit rather
    # than the whole file — an oversized file never gets fully buffered.
    content_length = request.headers.get("content-length")
    if content_length is not None and content_length.isdigit() and int(content_length) > max_size:
        raise FileTooLargeError(f"File exceeds the {max_size // (1024 * 1024)}MB size limit.")

    file_bytes = await file.read(max_size + 1)
    if len(file_bytes) > max_size:
        raise FileTooLargeError(f"File exceeds the {max_size // (1024 * 1024)}MB size limit.")

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
    """List uploaded documents, newest first."""
    service = DocumentService(db)
    documents = service.list(skip=skip, limit=limit)
    return [DocumentSummary.model_validate(d) for d in documents]


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db)) -> DocumentResponse:
    """Fetch one document, including its extracted text and extraction
    metadata."""
    service = DocumentService(db)
    document = service.get(document_id)
    return DocumentResponse.model_validate(document)


@router.post(
    "/{document_id}/analyze",
    response_model=AnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(analyze_rate_limiter)],
)
def analyze_document(
    document_id: str,
    platform: Platform = Query("generic"),
    db: Session = Depends(get_db),
) -> AnalysisResponse:
    """Run content analysis on an already-extracted document. `platform`
    only affects the prompt's framing — no social platform APIs are
    called. Returns the created analysis with blended scores, tone,
    sentiment, target audience, strengths, weaknesses, recommendations,
    the improved rewrite, and deterministic metrics."""
    document = DocumentService(db).get(document_id)
    analysis = AnalysisService(db).analyze_document(document, platform=platform)
    return AnalysisResponse.model_validate(analysis)


@router.get("/{document_id}/analysis", response_model=AnalysisResponse)
def get_document_analysis(document_id: str, db: Session = Depends(get_db)) -> AnalysisResponse:
    """The most recent analysis for this document (404 if it hasn't been
    analyzed yet). Lets the results page fetch by document id alone."""
    DocumentService(db).get(document_id)  # 404s if the document itself doesn't exist
    analysis = AnalysisService(db).get_by_document_id(document_id)
    return AnalysisResponse.model_validate(analysis)
