"""Tesseract OCR provider — free, open source, runs entirely locally."""

import pytesseract
from PIL import Image

from app.core.exceptions import OcrFailedError
from app.providers.ocr.base import OCRProvider, OcrResult


class TesseractOCRProvider(OCRProvider):
    def __init__(self, tesseract_cmd: str | None = None):
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    def extract(self, image: Image.Image) -> OcrResult:
        try:
            text = pytesseract.image_to_string(image)
            data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        except pytesseract.TesseractNotFoundError as exc:
            raise OcrFailedError(
                "Tesseract OCR engine is not installed or not found on PATH. Install it "
                "from https://github.com/tesseract-ocr/tesseract or set TESSERACT_CMD in .env."
            ) from exc
        except Exception as exc:  # covers pytesseract's TesseractError and other engine failures
            raise OcrFailedError(f"OCR engine failed: {exc}") from exc

        confidences = [
            int(value) for value in data.get("conf", []) if str(value).strip() not in ("", "-1")
        ]
        confidence = round(sum(confidences) / len(confidences), 1) if confidences else 0.0
        return OcrResult(text=text.strip(), confidence=confidence)
