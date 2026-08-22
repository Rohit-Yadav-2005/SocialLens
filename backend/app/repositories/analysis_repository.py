"""Data-access layer for Analysis rows. No business logic here."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.analysis import Analysis


class AnalysisRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, **fields) -> Analysis:
        analysis = Analysis(**fields)
        self.db.add(analysis)
        self.db.commit()
        self.db.refresh(analysis)
        return analysis

    def get(self, analysis_id: str) -> Analysis | None:
        return self.db.get(Analysis, analysis_id)

    def list(self, *, skip: int = 0, limit: int = 50) -> list[Analysis]:
        stmt = select(Analysis).order_by(Analysis.created_at.desc()).offset(skip).limit(limit)
        return list(self.db.execute(stmt).scalars().all())

    def get_by_document_id(self, document_id: str) -> Analysis | None:
        """Returns the most recent analysis for a document (a document can
        be re-analyzed, e.g. for a different platform)."""
        stmt = (
            select(Analysis)
            .where(Analysis.document_id == document_id)
            .order_by(Analysis.created_at.desc())
        )
        return self.db.execute(stmt).scalars().first()
