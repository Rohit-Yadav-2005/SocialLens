"""Integration test against the real Tesseract binary.

Every other OCR test mocks the engine so the suite passes without
Tesseract installed. This one exercises the actual binary and is skipped
automatically when it isn't available (see README for install
instructions) — install it and re-run `pytest` to bring this test in.
"""

import shutil

import pytest
from PIL import Image, ImageDraw, ImageFont

from app.core.config import get_settings
from app.providers.ocr.tesseract import TesseractOCRProvider

settings = get_settings()
_tesseract_available = bool(shutil.which("tesseract") or settings.tesseract_cmd)

pytestmark = pytest.mark.skipif(
    not _tesseract_available,
    reason="Tesseract binary not found on PATH or TESSERACT_CMD; install it to run this test.",
)


def _render_text_image(text: str) -> Image.Image:
    image = Image.new("L", (900, 120), color=255)
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("arial.ttf", 36)
    except OSError:
        font = ImageFont.load_default()
    draw.text((20, 30), text, fill=0, font=font)
    return image


def test_real_tesseract_reads_rendered_text():
    image = _render_text_image("Hello SocialLens")
    provider = TesseractOCRProvider(tesseract_cmd=settings.tesseract_cmd or None)

    result = provider.extract(image)

    assert "SocialLens" in result.text or "Hello" in result.text
    assert result.confidence > 0
