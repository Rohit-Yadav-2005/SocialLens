"""LLM provider interface.

Exactly one implementation exists today (Gemini). This interface is the
seam that lets a future provider slot in without touching AnalysisService
— see docs/decisions.md.
"""

from abc import ABC, abstractmethod
from typing import Literal

from pydantic import BaseModel, Field

Platform = Literal["linkedin", "instagram", "twitter", "generic"]


class AiAnalysisResult(BaseModel):
    """The structured JSON contract every LLM provider must return.
    Validated with Pydantic before any of it is trusted (see
    docs/decisions.md — a malformed AI response must never crash the app).
    """

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


class LLMProvider(ABC):
    @abstractmethod
    def analyze(self, *, text: str, platform: Platform = "generic") -> AiAnalysisResult:
        """Return a structured analysis of `text` for the given platform."""
