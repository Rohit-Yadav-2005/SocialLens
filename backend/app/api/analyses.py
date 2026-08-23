from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.analysis import AnalysisResponse, AnalysisSummary
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/analyses", tags=["analyses"])


@router.get("", response_model=list[AnalysisSummary])
def list_analyses(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[AnalysisSummary]:
    """List analyses, newest first."""
    service = AnalysisService(db)
    analyses = service.list(skip=skip, limit=limit)
    return [AnalysisSummary.model_validate(a) for a in analyses]


@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(analysis_id: str, db: Session = Depends(get_db)) -> AnalysisResponse:
    """Fetch one analysis by its own id."""
    service = AnalysisService(db)
    analysis = service.get(analysis_id)
    return AnalysisResponse.model_validate(analysis)
