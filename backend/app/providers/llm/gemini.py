"""Gemini implementation of LLMProvider.

All Gemini calls go through this one class — nothing else in the app
imports `google.genai` directly (see docs/decisions.md).
"""

import json
import logging
import time
from functools import lru_cache
from pathlib import Path
from string import Template

from google import genai
from google.genai import types
from pydantic import ValidationError

from app.core.exceptions import (
    AiAnalysisFailedError,
    AiRateLimitedError,
    InvalidAiResponseError,
)
from app.providers.llm.base import AiAnalysisResult, LLMProvider, Platform

logger = logging.getLogger(__name__)

_PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent / "prompts"

# Transient upstream failures worth a second attempt. 429 is included
# because free-tier Gemini keys have a low per-minute quota and a brief
# pause genuinely clears it; 4xx codes other than 429 are the caller's
# fault and retrying them just wastes the user's time.
_RETRYABLE_STATUS = frozenset({429, 500, 502, 503, 504})

# One backoff value per retry, so the retry count is len() + 1 attempts.
# Kept short deliberately: this runs inside the user's HTTP request, and
# the free-tier host is already slow enough that a long sleep here would
# push the whole analysis past the proxy's own timeout.
_RETRY_BACKOFF_SECONDS = (1.5, 4.0)


@lru_cache
def _load_prompt_template(name: str) -> Template:
    return Template((_PROMPTS_DIR / name).read_text(encoding="utf-8"))


def _response_status(exc: BaseException) -> int | None:
    """Best-effort HTTP status from a google-genai error.

    Deliberately duck-typed rather than importing the SDK's error classes:
    an unclassifiable exception returns None and is treated as fatal, which
    is the safe default — we only ever retry failures we positively
    identified as transient.
    """
    for attribute in ("code", "status_code"):
        value = getattr(exc, attribute, None)
        if isinstance(value, int):
            return value
    return None


class GeminiProvider(LLMProvider):
    def __init__(self, *, api_key: str, model: str):
        if not api_key:
            raise AiAnalysisFailedError(
                "GEMINI_API_KEY is not configured. Set it in backend/.env to enable AI analysis."
            )
        self._client = genai.Client(api_key=api_key)
        self._model = model

    def analyze(self, *, text: str, platform: Platform = "generic") -> AiAnalysisResult:
        prompt = _load_prompt_template("content_analysis.txt").substitute(
            platform=platform, content=text
        )

        response = self._generate_with_retry(prompt)

        raw_text = response.text
        if not raw_text:
            raise InvalidAiResponseError("Gemini returned an empty response.")

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise InvalidAiResponseError(f"Gemini returned non-JSON output: {exc}") from exc

        try:
            return AiAnalysisResult.model_validate(data)
        except ValidationError as exc:
            raise InvalidAiResponseError(
                f"Gemini response did not match the expected schema: {exc}"
            ) from exc

    def _generate_with_retry(self, prompt: str) -> types.GenerateContentResponse:
        attempts = len(_RETRY_BACKOFF_SECONDS) + 1

        for attempt in range(attempts):
            try:
                return self._client.models.generate_content(
                    model=self._model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=AiAnalysisResult,
                    ),
                )
            except Exception as exc:
                status = _response_status(exc)
                is_final_attempt = attempt == attempts - 1

                if status in _RETRYABLE_STATUS and not is_final_attempt:
                    delay = _RETRY_BACKOFF_SECONDS[attempt]
                    logger.warning(
                        "gemini_retry",
                        extra={"status": status, "attempt": attempt + 1, "delay": delay},
                    )
                    time.sleep(delay)
                    continue

                if status == 429:
                    raise AiRateLimitedError(
                        "The AI service is rate-limited right now. Wait a minute and try again."
                    ) from exc
                raise AiAnalysisFailedError(f"Gemini request failed: {exc}") from exc

        raise AssertionError("unreachable")  # pragma: no cover
