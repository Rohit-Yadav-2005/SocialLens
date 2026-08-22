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
from app.providers.llm.base import AiAnalysisResult, Platform
from app.providers.ocr.base import OcrResult
from app.providers.ocr.tesseract import TesseractOCRProvider
from app.services.analysis_service import AnalysisService

DEFAULT_OCR_TEXT = (
    "Just launched our biggest product update yet! We listened to your "
    "feedback and built exactly what you asked for. #ProductLaunch #Excited"
)

DEFAULT_AI_RESULT = AiAnalysisResult(
    overall_score=78,
    hook_score=80,
    clarity_score=82,
    engagement_score=75,
    cta_score=70,
    readability_score=88,
    tone="professional",
    sentiment="positive",
    target_audience="marketing professionals",
    strengths=["Clear value proposition", "Strong opening hook"],
    weaknesses=["Call to action could be more specific"],
    recommendations=["Add a direct link or next step for readers"],
    improved_content="An improved version of the post that keeps the same message.",
)


class FakeLLMProvider:
    """Stands in for GeminiProvider so tests never need a real API key or
    network access. Records each call for assertions."""

    def __init__(self, result: AiAnalysisResult | None = None, error: Exception | None = None):
        self.result = result or DEFAULT_AI_RESULT
        self.error = error
        self.calls: list[tuple[str, Platform]] = []

    def analyze(self, *, text: str, platform: Platform = "generic") -> AiAnalysisResult:
        self.calls.append((text, platform))
        if self.error:
            raise self.error
        return self.result


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
def mock_llm(monkeypatch):
    """Stub AnalysisService's default LLM provider so tests don't depend
    on GEMINI_API_KEY being set or on network access. Individual tests can
    build their own `FakeLLMProvider(error=...)` and re-patch afterward
    (via the same `monkeypatch`) to exercise other AI outcomes.
    """
    fake = FakeLLMProvider()
    monkeypatch.setattr(AnalysisService, "_default_provider", staticmethod(lambda: fake))
    return fake


@pytest.fixture()
def client(db_session_factory, tmp_path, monkeypatch, mock_ocr, mock_llm):
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
