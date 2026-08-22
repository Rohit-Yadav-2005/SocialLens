"""Response schema for GET /api/v1/insights."""

from datetime import datetime

from pydantic import BaseModel, Field


class ScoreTrendPoint(BaseModel):
    date: datetime
    overall_score: int = Field(ge=0, le=100)


class WeaknessCategoryCount(BaseModel):
    category: str
    count: int


class InsightsResponse(BaseModel):
    total_analyses: int

    # None (not 0) when there's no data yet — the frontend must show an
    # empty state, never a fabricated "0".
    average_overall_score: float | None
    average_hook_score: float | None
    average_cta_score: float | None

    score_trend: list[ScoreTrendPoint]
    common_weaknesses: list[WeaknessCategoryCount]
