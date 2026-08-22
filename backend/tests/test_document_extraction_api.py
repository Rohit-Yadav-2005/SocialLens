"""API-level tests for the extraction pipeline wired into document upload.

Every test here goes through `client`, which (via conftest's `mock_ocr`)
stubs the real Tesseract engine — these tests verify the pipeline's
decision logic (native vs OCR, failure handling, metadata surfaced),
not the OCR engine itself.
"""

from app.providers.ocr.base import OcrResult
from app.providers.ocr.tesseract import TesseractOCRProvider


def test_native_pdf_extraction_does_not_use_ocr(client, pdf_bytes):
    response = client.post(
        "/api/v1/documents",
        files={"file": ("post.pdf", pdf_bytes, "application/pdf")},
    )
    body = response.json()
    assert body["status"] == "processed"
    assert body["extraction_method"] == "native"
    assert body["ocr_confidence"] is None
    assert "ProductLaunch" in body["extracted_text"]


def test_scanned_pdf_falls_back_to_ocr(client, scanned_pdf_bytes, mock_ocr):
    response = client.post(
        "/api/v1/documents",
        files={"file": ("scan.pdf", scanned_pdf_bytes, "application/pdf")},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["status"] == "processed"
    assert body["extraction_method"] == "ocr"
    assert body["ocr_confidence"] == mock_ocr.confidence
    assert body["extracted_text"] == mock_ocr.text


def test_png_image_always_uses_ocr(client, png_bytes, mock_ocr):
    response = client.post(
        "/api/v1/documents",
        files={"file": ("post.png", png_bytes, "image/png")},
    )
    body = response.json()
    assert body["status"] == "processed"
    assert body["extraction_method"] == "ocr"
    assert body["extracted_text"] == mock_ocr.text
    assert body["ocr_confidence"] == mock_ocr.confidence


def test_jpeg_image_always_uses_ocr(client, jpeg_bytes, mock_ocr):
    response = client.post(
        "/api/v1/documents",
        files={"file": ("post.jpg", jpeg_bytes, "image/jpeg")},
    )
    body = response.json()
    assert body["status"] == "processed"
    assert body["extraction_method"] == "ocr"


def test_image_with_no_readable_text_marks_document_failed(client, png_bytes, monkeypatch):
    monkeypatch.setattr(
        TesseractOCRProvider, "extract", lambda self, image: OcrResult(text="   ", confidence=10.0)
    )

    response = client.post(
        "/api/v1/documents",
        files={"file": ("blank.png", png_bytes, "image/png")},
    )
    assert response.status_code == 422
    assert response.json()["error_code"] == "NO_TEXT_FOUND"

    # The document row is kept (status=failed) so it still shows up in history.
    listed = client.get("/api/v1/documents").json()
    assert len(listed) == 1
    assert listed[0]["status"] == "failed"


def test_ocr_engine_failure_marks_document_failed(client, png_bytes, monkeypatch):
    def raise_ocr_failure(self, image):
        from app.core.exceptions import OcrFailedError

        raise OcrFailedError("Tesseract OCR engine is not installed or not found on PATH.")

    monkeypatch.setattr(TesseractOCRProvider, "extract", raise_ocr_failure)

    response = client.post(
        "/api/v1/documents",
        files={"file": ("post.png", png_bytes, "image/png")},
    )
    assert response.status_code == 422
    assert response.json()["error_code"] == "OCR_FAILED"

    document_id = client.get("/api/v1/documents").json()[0]["id"]
    fetched = client.get(f"/api/v1/documents/{document_id}").json()
    assert fetched["status"] == "failed"
    assert "Tesseract" in fetched["error_message"]


def test_corrupted_pdf_is_rejected(client):
    response = client.post(
        "/api/v1/documents",
        files={"file": ("broken.pdf", b"%PDF-1.4\nnot a real pdf structure", "application/pdf")},
    )
    assert response.status_code == 422
    assert response.json()["error_code"] == "CORRUPTED_FILE"


def test_temp_file_removed_even_when_extraction_fails(client, png_bytes, monkeypatch, tmp_path):
    monkeypatch.setattr(
        TesseractOCRProvider, "extract", lambda self, image: OcrResult(text="", confidence=0.0)
    )
    response = client.post(
        "/api/v1/documents",
        files={"file": ("blank.png", png_bytes, "image/png")},
    )
    assert response.status_code == 422
    # Fetch the failed document's id from the list endpoint and confirm no
    # temp file was left behind for it.
    document_id = client.get("/api/v1/documents").json()[0]["id"]
    assert list(tmp_path.glob(f"{document_id}*")) == []
