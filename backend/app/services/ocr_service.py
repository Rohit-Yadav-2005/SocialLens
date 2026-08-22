"""OCR preprocessing + provider orchestration.

Preprocessing covers the spec's suggested steps that pay for themselves on
typical phone-photo/scan input: EXIF auto-rotation, grayscale, upscaling
small images, contrast enhancement, and Otsu binarization. Deskewing is
intentionally out of scope — see docs/decisions.md.
"""

import cv2
import numpy as np
from PIL import Image, ImageOps

from app.core.config import get_settings
from app.providers.ocr.base import OCRProvider, OcrResult
from app.providers.ocr.tesseract import TesseractOCRProvider

_MIN_DIMENSION_PX = 1500


class OcrService:
    def __init__(self, provider: OCRProvider | None = None):
        if provider is not None:
            self.provider = provider
        else:
            settings = get_settings()
            self.provider = TesseractOCRProvider(tesseract_cmd=settings.tesseract_cmd or None)

    def extract_from_image(self, image: Image.Image) -> OcrResult:
        preprocessed = self._preprocess(image)
        return self.provider.extract(preprocessed)

    def _preprocess(self, image: Image.Image) -> Image.Image:
        gray = ImageOps.exif_transpose(image).convert("L")

        if max(gray.size) < _MIN_DIMENSION_PX:
            scale = _MIN_DIMENSION_PX / max(gray.size)
            new_size = (round(gray.width * scale), round(gray.height * scale))
            gray = gray.resize(new_size, Image.LANCZOS)

        gray = ImageOps.autocontrast(gray)

        array = np.array(gray)
        _, binarized = cv2.threshold(array, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return Image.fromarray(binarized)
