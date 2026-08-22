"""Aggregate stats for the insights dashboard.

Every number here is computed directly from persisted `analyses` rows —
nothing is estimated or fabricated. When there isn't enough data, fields
are `None`/empty rather than a misleading default like 0.

"Common weaknesses" categorization: the AI returns free-form weakness
text (e.g. "The call to action is buried at the end"), not a structured
category. Rather than leave a real signal uncategorized, each weakness
string is matched against a small set of keyword phrases tied to the
app's own five score dimensions — the same category can be a
false-negative (unmatched real weakness) but never a false-positive on
data that doesn't exist. This is a transparent heuristic, not something
the AI was asked to classify — documented here and in the UI.
"""

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy.orm import Session

from app.repositories.analysis_repository import AnalysisRepository

_WEAKNESS_CATEGORIES: dict[str, tuple[str, ...]] = {
    "Weak hook": ("hook", "opening line", "first line", "grab attention", "attention-grabbing"),
    "Unclear messaging": ("clarity", "clear ", "confus", "hard to follow", "unclear"),
    "Low engagement": ("engagement", "engaging", "interact", "generic", "bland"),
    "Weak CTA": ("cta", "call to action", "call-to-action"),
    "Poor readability": ("readab", "sentence length", "wordy", "dense", "run-on", "too long"),
}

_DEFAULT_TREND_LIMIT = 50
_DEFAULT_TOP_WEAKNESSES = 5


@dataclass(frozen=True)
class InsightsSummary:
    total_analyses: int
    average_overall_score: float | None
    average_hook_score: float | None
    average_cta_score: float | None
    score_trend: list[tuple[datetime, int]]
    common_weaknesses: list[tuple[str, int]]


def categorize_weakness(text: str) -> list[str]:
    lowered = text.lower()
    return [
        category
        for category, keywords in _WEAKNESS_CATEGORIES.items()
        if any(keyword in lowered for keyword in keywords)
    ]


class InsightsService:
    def __init__(self, db: Session):
        self.repo = AnalysisRepository(db)

    def get_summary(
        self,
        *,
        trend_limit: int = _DEFAULT_TREND_LIMIT,
        top_weaknesses: int = _DEFAULT_TOP_WEAKNESSES,
    ) -> InsightsSummary:
        analyses = self.repo.list_all()
        total = len(analyses)

        if total == 0:
            return InsightsSummary(
                total_analyses=0,
                average_overall_score=None,
                average_hook_score=None,
                average_cta_score=None,
                score_trend=[],
                common_weaknesses=[],
            )

        average_overall = sum(a.overall_score for a in analyses) / total
        average_hook = sum(a.hook_score for a in analyses) / total
        average_cta = sum(a.cta_score for a in analyses) / total

        # repo.list_all() is already ordered oldest-first; keep only the
        # most recent `trend_limit` points for the chart.
        trend = [(a.created_at, a.overall_score) for a in analyses][-trend_limit:]

        weakness_counts: dict[str, int] = {}
        for analysis in analyses:
            for weakness in analysis.weaknesses:
                for category in categorize_weakness(weakness):
                    weakness_counts[category] = weakness_counts.get(category, 0) + 1
        common_weaknesses = sorted(weakness_counts.items(), key=lambda kv: kv[1], reverse=True)[
            :top_weaknesses
        ]

        return InsightsSummary(
            total_analyses=total,
            average_overall_score=round(average_overall, 1),
            average_hook_score=round(average_hook, 1),
            average_cta_score=round(average_cta, 1),
            score_trend=trend,
            common_weaknesses=common_weaknesses,
        )
