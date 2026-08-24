"""Orchestrates content analysis: deterministic metrics + AI analysis,
blended into final scores, persisted alongside the document.

The LLM provider is constructed lazily (only when `analyze_document` is
actually called), so read-only operations (`get`, `list`) never require
GEMINI_API_KEY to be set — see docs/decisions.md.
"""

# This class also has a `list` method — see the comment in
# analysis_repository.py for why annotations need to be lazy here too.
from __future__ import annotations

from dataclasses import asdict

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import AppError, NoTextFoundError, NotFoundError
from app.core.logging import get_logger
from app.models.analysis import Analysis
from app.models.document import Document, DocumentStatus
from app.providers.llm.base import LLMProvider, Platform
from app.providers.llm.gemini import GeminiProvider
from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.document_repository import DocumentRepository
from app.services.scoring_service import blend_scores, compute_metrics

logger = get_logger(__name__)


class AnalysisService:
    def __init__(self, db: Session, llm_provider: LLMProvider | None = None):
        self.repo = AnalysisRepository(db)
        self.document_repo = DocumentRepository(db)
        self.llm_provider = llm_provider

    def get(self, analysis_id: str) -> Analysis:
        analysis = self.repo.get(analysis_id)
        if analysis is None:
            raise NotFoundError(f"Analysis '{analysis_id}' not found.")
        return analysis

    def list(self, *, skip: int = 0, limit: int = 50) -> list[Analysis]:
        return self.repo.list(skip=skip, limit=limit)

    def get_by_document_id(self, document_id: str) -> Analysis:
        analysis = self.repo.get_by_document_id(document_id)
        if analysis is None:
            raise NotFoundError(f"Document '{document_id}' has not been analyzed yet.")
        return analysis

    def analyze_document(self, document: Document, *, platform: Platform = "generic") -> Analysis:
        if not document.extracted_text:
            raise NoTextFoundError(
                "This document has no extracted text to analyze. Upload a "
                "document that has completed extraction first."
            )

        provider = self.llm_provider or self._default_provider()

        self.document_repo.update_status(document, status=DocumentStatus.ANALYZING)
        try:
            metrics = compute_metrics(document.extracted_text)
            ai_result = provider.analyze(text=document.extracted_text, platform=platform)
            scores = blend_scores(metrics, ai_result)

            analysis = self.repo.create(
                document_id=document.id,
                overall_score=scores.overall_score,
                hook_score=scores.hook_score,
                clarity_score=scores.clarity_score,
                engagement_score=scores.engagement_score,
                cta_score=scores.cta_score,
                readability_score=scores.readability_score,
                tone=ai_result.tone,
                sentiment=ai_result.sentiment,
                target_audience=ai_result.target_audience,
                strengths=ai_result.strengths,
                weaknesses=ai_result.weaknesses,
                recommendations=ai_result.recommendations,
                improved_content=ai_result.improved_content,
                metrics=asdict(metrics),
            )
        except AppError as exc:
            # An expected failure mode (missing/invalid AI response,
            # provider error) — the caller already turns this into a
            # specific error code, so this is a warning, not a bug report.
            # Extraction already succeeded — revert to `processed` rather
            # than discarding it, so the caller can retry.
            logger.warning(
                "analysis_failed",
                extra={"document_id": document.id, "error_code": exc.error_code},
            )
            self.document_repo.update_status(document, status=DocumentStatus.PROCESSED)
            raise
        except Exception:
            # Anything else here is a genuine defect (e.g. a regression in
            # compute_metrics/blend_scores), not an expected AI-provider
            # failure — logged distinctly from the branch above rather
            # than relying solely on the global handler downstream to
            # tell the two apart.
            logger.exception("analysis_failed_unexpectedly", extra={"document_id": document.id})
            self.document_repo.update_status(document, status=DocumentStatus.PROCESSED)
            raise

        self.document_repo.update_status(document, status=DocumentStatus.ANALYZED)
        return analysis

    @staticmethod
    def _default_provider() -> LLMProvider:
        settings = get_settings()
        return GeminiProvider(api_key=settings.gemini_api_key, model=settings.gemini_model)
