from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.insights import InsightsResponse, ScoreTrendPoint, WeaknessCategoryCount
from app.services.insights_service import InsightsService

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("", response_model=InsightsResponse)
def get_insights(db: Session = Depends(get_db)) -> InsightsResponse:
    """Aggregate stats across every analysis: total count, average overall/
    hook/CTA scores (`null` when there's no data, never a fabricated `0`),
    a chronological score trend, and weakness categories (keyword-matched
    from the AI's free-form weakness text) ranked by frequency."""
    summary = InsightsService(db).get_summary()
    return InsightsResponse(
        total_analyses=summary.total_analyses,
        average_overall_score=summary.average_overall_score,
        average_hook_score=summary.average_hook_score,
        average_cta_score=summary.average_cta_score,
        score_trend=[
            ScoreTrendPoint(date=date, overall_score=score) for date, score in summary.score_trend
        ],
        common_weaknesses=[
            WeaknessCategoryCount(category=category, count=count)
            for category, count in summary.common_weaknesses
        ],
    )
