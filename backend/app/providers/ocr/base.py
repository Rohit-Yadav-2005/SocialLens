"""OCR provider interface.

Exactly one implementation exists today (Tesseract). This interface is
the seam that lets a future implementation (a cloud OCR API) slot in
without touching OcrService or ExtractionService — see docs/decisions.md.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass

from PIL import Image


@dataclass(frozen=True)
class OcrResult:
    text: str
    confidence: float  # 0-100


class OCRProvider(ABC):
    @abstractmethod
    def extract(self, image: Image.Image) -> OcrResult:
        """Run OCR on a single preprocessed image and return text + confidence."""
