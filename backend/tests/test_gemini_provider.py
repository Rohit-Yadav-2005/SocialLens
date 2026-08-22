"""Unit tests for GeminiProvider. These mock the google-genai SDK's
`generate_content` call directly, so they never hit the network or need a
real GEMINI_API_KEY.
"""

import json
from types import SimpleNamespace

import pytest

from app.core.exceptions import AiAnalysisFailedError, InvalidAiResponseError
from app.providers.llm.base import AiAnalysisResult
from app.providers.llm.gemini import GeminiProvider

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
