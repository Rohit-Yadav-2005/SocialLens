"""Unit tests for ExtractionService's native-vs-OCR decision logic.

A fake OcrService (recording what it's asked to do, returning canned
results) stands in for the real OCR pipeline so these tests don't depend
on Tesseract being installed.
"""

from pathlib import Path

import pymupdf
import pytest
from PIL import Image

from app.core.exceptions import CorruptedFileError, NoTextFoundError
from app.models.document import ExtractionMethod
from app.providers.ocr.base import OcrResult
from app.services.extraction_service import ExtractionService


class FakeOcrService:
    def __init__(self, result: OcrResult):
        self.result = result
        self.call_count = 0

    def extract_from_image(self, image) -> OcrResult:
        self.call_count += 1
        return self.result


def _write_pdf(tmp_path, *, pages_with_text: list[str | None]) -> Path:
    doc = pymupdf.open()
    for text in pages_with_text:
        page = doc.new_page()
        if text:
            page.insert_text((72, 72), text)
    path = tmp_path / "test.pdf"
    doc.save(str(path))
    doc.close()
    return path


def _write_image(tmp_path, name: str = "test.png") -> Path:
    path = tmp_path / name
    Image.new("RGB", (200, 80), color="white").save(path)
    return path


def test_native_pdf_extraction_skips_ocr_entirely(tmp_path):
    path = _write_pdf(tmp_path, pages_with_text=["A real social media post about our launch."])
    ocr = FakeOcrService(OcrResult(text="should not be used", confidence=0.0))
    service = ExtractionService(ocr_service=ocr)

    result = service.extract(path, "application/pdf")

    assert result.method == ExtractionMethod.NATIVE
    assert result.confidence is None
    assert "real social media post" in result.text
    assert ocr.call_count == 0


def test_blank_pdf_page_falls_back_to_ocr(tmp_path):
    path = _write_pdf(tmp_path, pages_with_text=[None])
    ocr = FakeOcrService(OcrResult(text="OCR recovered this text from a scan.", confidence=88.0))
    service = ExtractionService(ocr_service=ocr)

    result = service.extract(path, "application/pdf")

    assert result.method == ExtractionMethod.OCR
    assert result.confidence == 88.0
    assert result.text == "OCR recovered this text from a scan."
    assert ocr.call_count == 1


def test_mixed_pdf_only_ocrs_the_blank_pages(tmp_path):
    path = _write_pdf(
        tmp_path,
        pages_with_text=["Native text page with a real sentence here.", None],
    )
    ocr = FakeOcrService(OcrResult(text="Scanned page recovered by OCR.", confidence=70.0))
    service = ExtractionService(ocr_service=ocr)

    result = service.extract(path, "application/pdf")

    assert result.method == ExtractionMethod.OCR  # any page needing OCR marks the whole doc
    assert ocr.call_count == 1
    assert "Native text page" in result.text
    assert "Scanned page recovered" in result.text


def test_pdf_with_no_extractable_text_anywhere_raises_no_text_found(tmp_path):
    path = _write_pdf(tmp_path, pages_with_text=[None])
    ocr = FakeOcrService(OcrResult(text="", confidence=0.0))
    service = ExtractionService(ocr_service=ocr)

    with pytest.raises(NoTextFoundError):
        service.extract(path, "application/pdf")


def test_corrupted_pdf_raises_corrupted_file_error(tmp_path):
    path = tmp_path / "broken.pdf"
    path.write_bytes(b"%PDF-1.4\nthis is not a valid pdf body")
    service = ExtractionService(ocr_service=FakeOcrService(OcrResult(text="", confidence=0)))

    with pytest.raises(CorruptedFileError):
        service.extract(path, "application/pdf")


def test_pdf_with_zero_pages_raises_corrupted_file_error(tmp_path, monkeypatch):
    # PyMuPDF's own `save()` refuses to write a zero-page PDF, so a real
    # file can't be used to exercise this defensive branch — stub `open`
    # with a fake document that reports zero pages instead.
    class EmptyDocument:
        page_count = 0

        def close(self):
            pass

    monkeypatch.setattr(pymupdf, "open", lambda **kwargs: EmptyDocument())
    path = tmp_path / "empty.pdf"
    path.write_bytes(b"%PDF-1.4\n%stub")
    service = ExtractionService(ocr_service=FakeOcrService(OcrResult(text="", confidence=0)))

    with pytest.raises(CorruptedFileError):
        service.extract(path, "application/pdf")


def test_image_always_uses_ocr(tmp_path):
    path = _write_image(tmp_path)
    ocr = FakeOcrService(OcrResult(text="Text recovered from an image via OCR.", confidence=91.2))
    service = ExtractionService(ocr_service=ocr)

    result = service.extract(path, "image/png")

    assert result.method == ExtractionMethod.OCR
    assert result.confidence == 91.2
    assert ocr.call_count == 1


def test_image_with_no_readable_text_raises_no_text_found(tmp_path):
    path = _write_image(tmp_path)
    ocr = FakeOcrService(OcrResult(text="   ", confidence=5.0))
    service = ExtractionService(ocr_service=ocr)

    with pytest.raises(NoTextFoundError):
        service.extract(path, "image/png")


def test_corrupted_image_raises_corrupted_file_error(tmp_path):
    path = tmp_path / "broken.png"
    path.write_bytes(b"not a real png file at all")
    service = ExtractionService(ocr_service=FakeOcrService(OcrResult(text="", confidence=0)))

    with pytest.raises(CorruptedFileError):
        service.extract(path, "image/png")
