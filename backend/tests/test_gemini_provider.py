"""Unit tests for GeminiProvider. These mock the google-genai SDK's
`generate_content` call directly, so they never hit the network or need a
real GEMINI_API_KEY.
"""

import json
from types import SimpleNamespace

import pytest

from app.core.exceptions import (
    AiAnalysisFailedError,
    AiRateLimitedError,
    InvalidAiResponseError,
)
from app.providers.llm.base import AiAnalysisResult
from app.providers.llm.gemini import GeminiProvider


class _ApiError(Exception):
    """Stands in for a google-genai APIError, which carries an HTTP `code`."""

    def __init__(self, code: int, message: str = "upstream error"):
        super().__init__(message)
        self.code = code


@pytest.fixture(autouse=True)
def _no_sleep(monkeypatch):
    """Retry backoff is real time; tests assert the retry logic, not the wait."""
    monkeypatch.setattr("app.providers.llm.gemini.time.sleep", lambda _seconds: None)


VALID_PAYLOAD = {
    "overall_score": 82,
    "hook_score": 90,
    "clarity_score": 84,
    "engagement_score": 81,
    "cta_score": 73,
    "readability_score": 85,
    "tone": "professional",
    "sentiment": "positive",
    "target_audience": "B2B marketers",
    "strengths": ["Clear structure"],
    "weaknesses": ["Weak call to action"],
    "recommendations": ["Add a direct CTA"],
    "improved_content": "Improved post text.",
}


def _provider() -> GeminiProvider:
    return GeminiProvider(api_key="test-key-not-real", model="gemini-2.5-flash")


def test_missing_api_key_raises_ai_analysis_failed():
    with pytest.raises(AiAnalysisFailedError, match="GEMINI_API_KEY"):
        GeminiProvider(api_key="", model="gemini-2.5-flash")


def test_analyze_returns_validated_result_on_valid_json(monkeypatch):
    provider = _provider()
    fake_response = SimpleNamespace(text=json.dumps(VALID_PAYLOAD))
    monkeypatch.setattr(provider._client.models, "generate_content", lambda **kwargs: fake_response)

    result = provider.analyze(text="Some social media content", platform="linkedin")

    assert isinstance(result, AiAnalysisResult)
    assert result.overall_score == 82
    assert result.strengths == ["Clear structure"]


def test_analyze_sends_platform_and_content_in_prompt(monkeypatch):
    provider = _provider()
    fake_response = SimpleNamespace(text=json.dumps(VALID_PAYLOAD))
    captured = {}

    def fake_generate_content(**kwargs):
        captured.update(kwargs)
        return fake_response

    monkeypatch.setattr(provider._client.models, "generate_content", fake_generate_content)

    provider.analyze(text="Unique marker XYZ123", platform="instagram")

    assert "instagram" in captured["contents"]
    assert "Unique marker XYZ123" in captured["contents"]


def test_analyze_raises_ai_analysis_failed_on_request_error(monkeypatch):
    provider = _provider()

    def raise_error(**kwargs):
        raise RuntimeError("connection reset")

    monkeypatch.setattr(provider._client.models, "generate_content", raise_error)

    with pytest.raises(AiAnalysisFailedError, match="connection reset"):
        provider.analyze(text="content", platform="generic")


def test_analyze_retries_transient_error_then_succeeds(monkeypatch):
    provider = _provider()
    calls = {"n": 0}

    def flaky(**kwargs):
        calls["n"] += 1
        if calls["n"] < 3:
            raise _ApiError(503, "service unavailable")
        return SimpleNamespace(text=json.dumps(VALID_PAYLOAD))

    monkeypatch.setattr(provider._client.models, "generate_content", flaky)

    result = provider.analyze(text="content", platform="generic")

    assert result.overall_score == 82
    assert calls["n"] == 3  # two failures, third attempt succeeded


def test_analyze_retries_rate_limit_then_raises_dedicated_error(monkeypatch):
    provider = _provider()
    calls = {"n": 0}

    def always_rate_limited(**kwargs):
        calls["n"] += 1
        raise _ApiError(429, "RESOURCE_EXHAUSTED")

    monkeypatch.setattr(provider._client.models, "generate_content", always_rate_limited)

    with pytest.raises(AiRateLimitedError, match="rate-limited"):
        provider.analyze(text="content", platform="generic")

    assert calls["n"] == 3  # exhausted every attempt before giving up


def test_analyze_does_not_retry_non_transient_error(monkeypatch):
    """A 400 is the caller's fault — retrying only delays the error."""
    provider = _provider()
    calls = {"n": 0}

    def bad_request(**kwargs):
        calls["n"] += 1
        raise _ApiError(400, "invalid argument")

    monkeypatch.setattr(provider._client.models, "generate_content", bad_request)

    with pytest.raises(AiAnalysisFailedError):
        provider.analyze(text="content", platform="generic")

    assert calls["n"] == 1


def test_analyze_does_not_retry_unclassifiable_error(monkeypatch):
    """No status code means we can't call it transient, so fail fast."""
    provider = _provider()
    calls = {"n": 0}

    def raise_error(**kwargs):
        calls["n"] += 1
        raise RuntimeError("connection reset")

    monkeypatch.setattr(provider._client.models, "generate_content", raise_error)

    with pytest.raises(AiAnalysisFailedError, match="connection reset"):
        provider.analyze(text="content", platform="generic")

    assert calls["n"] == 1


def test_analyze_raises_invalid_ai_response_on_empty_text(monkeypatch):
    provider = _provider()
    monkeypatch.setattr(
        provider._client.models, "generate_content", lambda **kwargs: SimpleNamespace(text="")
    )

    with pytest.raises(InvalidAiResponseError, match="empty"):
        provider.analyze(text="content", platform="generic")


def test_analyze_raises_invalid_ai_response_on_non_json_text(monkeypatch):
    provider = _provider()
    monkeypatch.setattr(
        provider._client.models,
        "generate_content",
        lambda **kwargs: SimpleNamespace(text="Sorry, I can't help with that."),
    )

    with pytest.raises(InvalidAiResponseError):
        provider.analyze(text="content", platform="generic")


def test_analyze_raises_invalid_ai_response_on_schema_violation(monkeypatch):
    provider = _provider()
    bad_payload = dict(VALID_PAYLOAD)
    bad_payload["overall_score"] = 150  # out of the 0-100 range
    monkeypatch.setattr(
        provider._client.models,
        "generate_content",
        lambda **kwargs: SimpleNamespace(text=json.dumps(bad_payload)),
    )

    with pytest.raises(InvalidAiResponseError):
        provider.analyze(text="content", platform="generic")


def test_analyze_raises_invalid_ai_response_on_missing_field(monkeypatch):
    provider = _provider()
    incomplete_payload = dict(VALID_PAYLOAD)
    del incomplete_payload["improved_content"]
    monkeypatch.setattr(
        provider._client.models,
        "generate_content",
        lambda **kwargs: SimpleNamespace(text=json.dumps(incomplete_payload)),
    )

    with pytest.raises(InvalidAiResponseError):
        provider.analyze(text="content", platform="generic")
