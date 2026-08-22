"""Unit tests for TesseractOCRProvider's wrapping logic (confidence
averaging, error translation). These mock `pytesseract` directly so they
pass whether or not the real Tesseract binary is installed.
"""

import pytesseract
import pytest
from PIL import Image

from app.core.exceptions import OcrFailedError
from app.providers.ocr.tesseract import TesseractOCRProvider


def _fake_image() -> Image.Image:
    return Image.new("L", (10, 10), color=255)


def test_extract_returns_stripped_text_and_average_confidence(monkeypatch):
    monkeypatch.setattr(pytesseract, "image_to_string", lambda image: "  Hello world  \n")
    monkeypatch.setattr(
        pytesseract,
        "image_to_data",
        lambda image, output_type: {"conf": ["90", "80", "-1", ""]},
    )

    result = TesseractOCRProvider().extract(_fake_image())

    assert result.text == "Hello world"
    assert result.confidence == 85.0  # average of 90 and 80; -1/"" (no detection) excluded


def test_extract_returns_zero_confidence_when_no_words_detected(monkeypatch):
    monkeypatch.setattr(pytesseract, "image_to_string", lambda image: "")
    monkeypatch.setattr(
        pytesseract, "image_to_data", lambda image, output_type: {"conf": ["-1", "-1"]}
    )

    result = TesseractOCRProvider().extract(_fake_image())

    assert result.text == ""
    assert result.confidence == 0.0


def test_extract_raises_ocr_failed_when_tesseract_not_installed(monkeypatch):
    def raise_not_found(image):
        raise pytesseract.TesseractNotFoundError()

    monkeypatch.setattr(pytesseract, "image_to_string", raise_not_found)

    with pytest.raises(OcrFailedError, match="not installed"):
        TesseractOCRProvider().extract(_fake_image())


def test_extract_raises_ocr_failed_on_unexpected_engine_error(monkeypatch):
    def raise_generic(image):
        raise RuntimeError("engine exploded")

    monkeypatch.setattr(pytesseract, "image_to_string", raise_generic)

    with pytest.raises(OcrFailedError, match="engine exploded"):
        TesseractOCRProvider().extract(_fake_image())


def test_constructor_sets_custom_tesseract_cmd(monkeypatch):
    monkeypatch.setattr(pytesseract.pytesseract, "tesseract_cmd", "tesseract")
    TesseractOCRProvider(tesseract_cmd="C:/custom/tesseract.exe")
    assert pytesseract.pytesseract.tesseract_cmd == "C:/custom/tesseract.exe"
