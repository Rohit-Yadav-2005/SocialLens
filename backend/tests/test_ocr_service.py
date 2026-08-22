"""Unit tests for OcrService's preprocessing step, verified via a fake
provider that records the image it was actually handed — no real Tesseract
engine involved.
"""

from PIL import Image

from app.providers.ocr.base import OcrResult
from app.services.ocr_service import _MIN_DIMENSION_PX, OcrService


class RecordingProvider:
    def __init__(self):
        self.received_image: Image.Image | None = None

    def extract(self, image: Image.Image) -> OcrResult:
        self.received_image = image
        return OcrResult(text="captured", confidence=42.0)


def test_preprocessing_converts_to_grayscale_single_channel():
    provider = RecordingProvider()
    service = OcrService(provider=provider)
    color_image = Image.new("RGB", (2000, 500), color=(200, 30, 30))

    service.extract_from_image(color_image)

    assert provider.received_image.mode == "L"


def test_preprocessing_upscales_small_images():
    provider = RecordingProvider()
    service = OcrService(provider=provider)
    small_image = Image.new("RGB", (300, 100), color="white")

    service.extract_from_image(small_image)

    assert max(provider.received_image.size) >= _MIN_DIMENSION_PX


def test_preprocessing_leaves_already_large_images_at_original_scale():
    provider = RecordingProvider()
    service = OcrService(provider=provider)
    large_image = Image.new("RGB", (2000, 1000), color="white")

    service.extract_from_image(large_image)

    assert provider.received_image.size == (2000, 1000)


def test_extract_from_image_returns_the_providers_result():
    provider = RecordingProvider()
    service = OcrService(provider=provider)

    result = service.extract_from_image(Image.new("RGB", (500, 500), color="white"))

    assert result.text == "captured"
    assert result.confidence == 42.0
