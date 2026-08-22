"""Gemini implementation of LLMProvider.

All Gemini calls go through this one class — nothing else in the app
imports `google.genai` directly (see docs/decisions.md).
"""

import json
from functools import lru_cache
from pathlib import Path
from string import Template

from google import genai
from google.genai import types
from pydantic import ValidationError

from app.core.exceptions import AiAnalysisFailedError, InvalidAiResponseError
from app.providers.llm.base import AiAnalysisResult, LLMProvider, Platform

_PROMPTS_DIR = Path(__file__).resolve().parent.parent.parent / "prompts"


@lru_cache
def _load_prompt_template(name: str) -> Template:
    return Template((_PROMPTS_DIR / name).read_text(encoding="utf-8"))


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

        try:
            response = self._client.models.generate_content(
                model=self._model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=AiAnalysisResult,
                ),
            )
        except Exception as exc:
            raise AiAnalysisFailedError(f"Gemini request failed: {exc}") from exc

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
