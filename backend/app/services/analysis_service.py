"""Read-side orchestration for analyses. Writing analyses is owned by the
content-analysis pipeline (added in a later phase); this service only
supports listing and fetching persisted results.
"""

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.models.analysis import Analysis
from app.repositories.analysis_repository import AnalysisRepository


class AnalysisService:
    def __init__(self, db: Session):
        self.repo = AnalysisRepository(db)

    def get(self, analysis_id: str) -> Analysis:
        analysis = self.repo.get(analysis_id)
        if analysis is None:
            raise NotFoundError(f"Analysis '{analysis_id}' not found.")
        return analysis

    def list(self, *, skip: int = 0, limit: int = 50) -> list[Analysis]:
        return self.repo.list(skip=skip, limit=limit)
