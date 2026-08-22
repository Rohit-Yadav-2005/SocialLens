"""DocumentExtractor: decides native-vs-OCR per document/page and returns
normalized text plus extraction metadata.

Strategy (see docs/architecture.md for the full diagram):
    PDF  -> try native text per page -> OCR fallback for pages with no
            meaningful native text (handles fully-scanned and mixed PDFs)
    image -> always OCR

The caller never has to pick a mode; the decision is made per page from
whether PyMuPDF's native extraction produced anything meaningful.
"""

from dataclasses import dataclass
from pathlib import Path

import pymupdf
from PIL import Image, UnidentifiedImageError

from app.core.exceptions import CorruptedFileError, NoTextFoundError
from app.models.document import ExtractionMethod
from app.services.ocr_service import OcrService
from app.utils.text_processing import is_meaningful_text, normalize_text

_RENDER_DPI = 200


@dataclass(frozen=True)
class ExtractionResult:
    text: str
    method: ExtractionMethod
    confidence: float | None  # None for native text; set when OCR was used


class ExtractionService:
    def __init__(self, ocr_service: OcrService | None = None):
        self.ocr_service = ocr_service or OcrService()

    def extract(self, file_path: Path, content_type: str) -> ExtractionResult:
        if content_type == "application/pdf":
            return self._extract_pdf(file_path)
        return self._extract_image(file_path)

    def _extract_image(self, file_path: Path) -> ExtractionResult:
        try:
            with Image.open(file_path) as image:
                image.load()
                ocr_result = self.ocr_service.extract_from_image(image)
        except (UnidentifiedImageError, OSError) as exc:
            raise CorruptedFileError(f"Could not read image file: {exc}") from exc

        text = normalize_text(ocr_result.text)
        if not is_meaningful_text(text):
            raise NoTextFoundError(
                "No readable text could be found in this image. Try a higher-resolution scan."
            )
        return ExtractionResult(
            text=text, method=ExtractionMethod.OCR, confidence=ocr_result.confidence
        )

    def _extract_pdf(self, file_path: Path) -> ExtractionResult:
        # Open from an in-memory buffer, not the path: PyMuPDF opening by
        # filename can keep an OS-level file handle open on Windows even
        # after raising on a malformed PDF, which then blocks the caller
        # from deleting the temp file.
        try:
            doc = pymupdf.open(stream=file_path.read_bytes(), filetype="pdf")
        except Exception as exc:
            raise CorruptedFileError(f"Could not open PDF file: {exc}") from exc

        try:
            if doc.page_count == 0:
                raise CorruptedFileError("PDF has no pages.")

            page_texts: list[str] = []
            confidences: list[float] = []
            used_ocr = False

            for page in doc:
                native_text = page.get_text("text")
                if is_meaningful_text(native_text):
                    page_texts.append(native_text)
                    continue

                # No usable native text on this page — treat it as scanned
                # and OCR it. Page-by-page, so a mixed native/scanned PDF
                # only pays the OCR cost where it's actually needed.
                used_ocr = True
                pixmap = page.get_pixmap(dpi=_RENDER_DPI, colorspace=pymupdf.csRGB)
                image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
                ocr_result = self.ocr_service.extract_from_image(image)
                page_texts.append(ocr_result.text)
                confidences.append(ocr_result.confidence)
        finally:
            doc.close()

        combined = "\n\n".join(page_text for page_text in page_texts if page_text.strip())
        text = normalize_text(combined)
        if not is_meaningful_text(text):
            raise NoTextFoundError(
                "No readable text could be extracted from this PDF, even with OCR."
            )

        method = ExtractionMethod.OCR if used_ocr else ExtractionMethod.NATIVE
        confidence = round(sum(confidences) / len(confidences), 1) if confidences else None
        return ExtractionResult(text=text, method=method, confidence=confidence)
