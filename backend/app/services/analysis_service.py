"""Orchestrates content analysis: deterministic metrics + AI analysis,
blended into final scores, persisted alongside the document.

The LLM provider is constructed lazily (only when `analyze_document` is
actually called), so read-only operations (`get`, `list`) never require
GEMINI_API_KEY to be set — see docs/decisions.md.
"""

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.exceptions import NoTextFoundError, NotFoundError
from app.models.analysis import Analysis
from app.models.document import Document, DocumentStatus
from app.providers.llm.base import LLMProvider, Platform
from app.providers.llm.gemini import GeminiProvider
from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.document_repository import DocumentRepository
from app.services.scoring_service import blend_scores, compute_metrics


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
            )
        except Exception:
            # Extraction already succeeded — an analysis failure shouldn't
            # discard that. Revert to `processed` so the caller can retry.
            self.document_repo.update_status(document, status=DocumentStatus.PROCESSED)
            raise

        self.document_repo.update_status(document, status=DocumentStatus.ANALYZED)
        return analysis

    @staticmethod
    def _default_provider() -> LLMProvider:
        settings = get_settings()
        return GeminiProvider(api_key=settings.gemini_api_key, model=settings.gemini_model)
