"""Request/response schemas for the analyses API."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


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

    created_at: datetime


class AnalysisSummary(BaseModel):
    """Lighter payload for list views (insights page aggregates)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    document_id: str
    overall_score: int = Field(ge=0, le=100)
    created_at: datetime
