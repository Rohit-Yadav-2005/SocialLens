"""Data-access layer for Analysis rows. No business logic here."""

# Methods below are named after builtins (`list`). Without this, a later
# method's own annotation referencing `list[...]` resolves `list` to the
# `list` method itself instead of the builtin — Python evaluates
# annotations eagerly, in the class body's own namespace, by default. This
# genuinely doesn't crash on Python 3.14 (PEP 649 made annotations lazy by
# default there) but does on every earlier version, including the 3.12 an
# actual deployment runs — confirmed the hard way. See docs/decisions.md.
from __future__ import annotations

from datetime import datetime

from sqlalchemy import func, select
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

    def aggregate_stats(self) -> tuple[int, float | None, float | None, float | None]:
        """(count, avg_overall, avg_hook, avg_cta) computed in SQL — for
        insights' averages, which never need a full row materialized.
        See docs/decisions.md."""
        stmt = select(
            func.count(Analysis.id),
            func.avg(Analysis.overall_score),
            func.avg(Analysis.hook_score),
            func.avg(Analysis.cta_score),
        )
        return self.db.execute(stmt).one()

    def list_trend_and_weaknesses(self) -> list[tuple[datetime, int, list[str]]]:
        """Oldest-first (created_at, overall_score, weaknesses) — only the
        columns insights' score trend and weakness categorization
        actually need, not every column of every analysis row."""
        stmt = select(Analysis.created_at, Analysis.overall_score, Analysis.weaknesses).order_by(
            Analysis.created_at.asc()
        )
        return list(self.db.execute(stmt).all())

    def get_by_document_id(self, document_id: str) -> Analysis | None:
        """Returns the most recent analysis for a document (a document can
        be re-analyzed, e.g. for a different platform)."""
        stmt = (
            select(Analysis)
            .where(Analysis.document_id == document_id)
            .order_by(Analysis.created_at.desc())
        )
        return self.db.execute(stmt).scalars().first()
