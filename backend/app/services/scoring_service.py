"""Deterministic content metrics and the hybrid (deterministic + AI) score
blend. The scoring model is intentionally simple and transparent rather
than a statistically validated predictor — see README "Known limitations".

Which scores are blended, and how:
    readability_score  — 100% deterministic (Flesch-based). The AI is not
                          asked to judge readability; a formula is more
                          consistent for this one dimension.
    hook_score          — 100% AI (no deterministic proxy for hook strength)
    clarity_score       — 100% AI (no deterministic proxy for clarity)
    engagement_score    — 100% AI (no deterministic proxy for engagement)
    cta_score           — 30% deterministic (CTA presence) + 70% AI (CTA
                          quality) — deterministic metrics can only detect
                          *presence*, not persuasiveness
    overall_score       — 40% deterministic metrics + 60% AI, per spec
Weights are an initial, adjustable choice, not a tuned/validated model.
"""

import re
from dataclasses import dataclass

from app.providers.llm.base import AiAnalysisResult

_HASHTAG_RE = re.compile(r"#\w+")
_MENTION_RE = re.compile(r"@\w+")
_URL_RE = re.compile(r"https?://\S+")
_SENTENCE_SPLIT_RE = re.compile(r"[.!?]+(?:\s+|$)")
_WORD_RE = re.compile(r"\b[a-zA-Z']+\b")
_VOWEL_GROUP_RE = re.compile(r"[aeiouy]+")

# Broad but simple emoji ranges — covers the common emoji blocks without
# trying to be an exhaustive Unicode emoji classifier.
_EMOJI_RE = re.compile(
    "[" "\U0001f300-\U0001faff" "\U00002600-\U000027bf" "\U0001f1e6-\U0001f1ff" "]"
)

_CTA_PHRASES = (
    "click here", "click the link", "link in bio", "sign up", "sign-up",
    "subscribe", "shop now", "buy now", "learn more", "read more",
    "download", "get started", "join us", "join now", "follow us",
    "share this", "share with", "tag a friend", "comment below",
    "drop a comment", "let us know", "dm me", "dm us", "check out",
    "check it out", "swipe up", "book now", "register now", "apply now",
    "visit our", "visit us",
)  # fmt: skip


@dataclass(frozen=True)
class ContentMetrics:
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
    readability_score: int  # 0-100, approximate (Flesch Reading Ease)


@dataclass(frozen=True)
class BlendedScores:
    overall_score: int
    hook_score: int
    clarity_score: int
    engagement_score: int
    cta_score: int
    readability_score: int


def _clamp(value: float, low: int = 0, high: int = 100) -> int:
    return max(low, min(high, round(value)))


def _count_syllables(word: str) -> int:
    word = word.lower()
    groups = _VOWEL_GROUP_RE.findall(word)
    count = len(groups)
    if word.endswith("e") and count > 1:
        count -= 1
    return max(count, 1)


def _flesch_reading_ease(word_count: int, sentence_count: int, words: list[str]) -> int:
    if word_count == 0 or sentence_count == 0:
        return 0
    syllables = sum(_count_syllables(w) for w in words)
    score = 206.835 - 1.015 * (word_count / sentence_count) - 84.6 * (syllables / word_count)
    return _clamp(score)


def compute_metrics(text: str) -> ContentMetrics:
    words = _WORD_RE.findall(text)
    word_count = len(words)
    sentences = [s for s in _SENTENCE_SPLIT_RE.split(text) if s.strip()]
    sentence_count = len(sentences) or (1 if word_count else 0)
    paragraphs = [p for p in text.split("\n\n") if p.strip()]
    lowered = text.lower()

    return ContentMetrics(
        word_count=word_count,
        char_count=len(text.strip()),
        sentence_count=sentence_count,
        avg_sentence_length=round(word_count / sentence_count, 1) if sentence_count else 0.0,
        hashtag_count=len(_HASHTAG_RE.findall(text)),
        mention_count=len(_MENTION_RE.findall(text)),
        url_count=len(_URL_RE.findall(text)),
        emoji_count=len(_EMOJI_RE.findall(text)),
        question_count=text.count("?"),
        has_cta=any(phrase in lowered for phrase in _CTA_PHRASES),
        paragraph_count=len(paragraphs) or (1 if text.strip() else 0),
        readability_score=_flesch_reading_ease(word_count, sentence_count, words),
    )


def _deterministic_overall(metrics: ContentMetrics) -> int:
    ideal_center = 110
    length_score = _clamp(100 - abs(metrics.word_count - ideal_center) * 0.6)

    cta_component = 100 if metrics.has_cta else 40
    hashtag_component = 100 if 1 <= metrics.hashtag_count <= 8 else 55
    hook_component = 100 if (metrics.question_count > 0 or metrics.mention_count > 0) else 60

    return _clamp(
        0.30 * length_score
        + 0.20 * cta_component
        + 0.15 * hashtag_component
        + 0.15 * hook_component
        + 0.20 * metrics.readability_score
    )


def blend_scores(metrics: ContentMetrics, ai: AiAnalysisResult) -> BlendedScores:
    deterministic_overall = _deterministic_overall(metrics)
    cta_presence_component = 100 if metrics.has_cta else 30

    return BlendedScores(
        overall_score=_clamp(0.4 * deterministic_overall + 0.6 * ai.overall_score),
        hook_score=_clamp(ai.hook_score),
        clarity_score=_clamp(ai.clarity_score),
        engagement_score=_clamp(ai.engagement_score),
        cta_score=_clamp(0.3 * cta_presence_component + 0.7 * ai.cta_score),
        readability_score=metrics.readability_score,
    )
