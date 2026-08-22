"""Request/response schemas for the analyses API."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ContentMetricsSchema(BaseModel):
    """Mirrors app.services.scoring_service.ContentMetrics — the
    deterministic counts computed independently of the LLM."""

    word_count: int
    char_count: int
    sentence_count: int
    avg_sentence_length: float
    hashtag_count: int
    mention_count: int
    url_count: int
    emoji_count: int
    question_count: int
    has_cta: bool
    paragraph_count: int
    readability_score: int = Field(ge=0, le=100)


class AnalysisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: str

    overall_score: int = Field(ge=0, le=100)
    hook_score: int = Field(ge=0, le=100)
    clarity_score: int = Field(ge=0, le=100)
    engagement_score: int = Field(ge=0, le=100)
    cta_score: int = Field(ge=0, le=100)
    readability_score: int = Field(ge=0, le=100)

    tone: str
    sentiment: str
    target_audience: str

    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]
    improved_content: str
    metrics: ContentMetricsSchema

    created_at: datetime


class AnalysisSummary(BaseModel):
    """Lighter payload for list views (insights page aggregates)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: str
    overall_score: int = Field(ge=0, le=100)
    created_at: datetime
