import io

import pymupdf
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import get_settings
from app.core.database import Base, get_db
from app.main import app
from app.providers.ocr.base import OcrResult
from app.providers.ocr.tesseract import TesseractOCRProvider

DEFAULT_OCR_TEXT = (
    "Just launched our biggest product update yet! We listened to your "
    "feedback and built exactly what you asked for. #ProductLaunch #Excited"
)


@pytest.fixture()
def db_session_factory():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def mock_ocr(monkeypatch):
    """Stub the real Tesseract engine so tests don't depend on it being
    installed. Individual tests can re-patch `TesseractOCRProvider.extract`
    afterward (via the same `monkeypatch`) to exercise other OCR outcomes.
    """
    result = OcrResult(text=DEFAULT_OCR_TEXT, confidence=95.5)
    monkeypatch.setattr(TesseractOCRProvider, "extract", lambda self, image: result)
    return result


@pytest.fixture()
def client(db_session_factory, tmp_path, monkeypatch, mock_ocr):
    settings = get_settings()
    monkeypatch.setattr(settings, "temp_dir", tmp_path)

    def override_get_db():
        db = db_session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def pdf_bytes() -> bytes:
    """A real, parseable single-page PDF with embedded (native) text —
    exercises the native-extraction path without needing OCR at all.
    """
    doc = pymupdf.open()
    page = doc.new_page()
    page.insert_text(
        (72, 72),
        "Just launched our biggest product update yet! #ProductLaunch @company",
    )
    data = doc.tobytes()
    doc.close()
    return data


@pytest.fixture()
def scanned_pdf_bytes() -> bytes:
    """A real, parseable single-page PDF with no text layer at all —
    exercises the automatic scanned-PDF detection -> OCR fallback path.
    """
    doc = pymupdf.open()
    doc.new_page()
    data = doc.tobytes()
    doc.close()
    return data


@pytest.fixture()
def png_bytes() -> bytes:
    """A real, valid PNG. Images always go through OCR."""
    image = Image.new("RGB", (200, 80), color="white")
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


@pytest.fixture()
def jpeg_bytes() -> bytes:
    image = Image.new("RGB", (200, 80), color="white")
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG")
    return buffer.getvalue()
