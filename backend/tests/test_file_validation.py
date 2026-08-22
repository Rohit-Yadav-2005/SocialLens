import pytest

from app.core.exceptions import FileTooLargeError, InvalidFileTypeError
from app.utils.file_validation import validate_upload

PDF_BYTES = b"%PDF-1.4\n...\n"
PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 16


def test_valid_pdf_passes():
    result = validate_upload(
        filename="post.pdf",
        content_type="application/pdf",
        file_bytes=PDF_BYTES,
        max_size_bytes=1024,
    )
    assert result.extension == ".pdf"
    assert result.content_type == "application/pdf"


def test_valid_png_passes():
    result = validate_upload(
        filename="post.png",
        content_type="image/png",
        file_bytes=PNG_BYTES,
        max_size_bytes=1024,
    )
    assert result.extension == ".png"


def test_rejects_disallowed_extension():
    with pytest.raises(InvalidFileTypeError):
        validate_upload(
            filename="post.exe",
            content_type="application/pdf",
            file_bytes=PDF_BYTES,
            max_size_bytes=1024,
        )


def test_rejects_disallowed_mime_type():
    with pytest.raises(InvalidFileTypeError):
        validate_upload(
            filename="post.pdf",
            content_type="application/x-msdownload",
            file_bytes=PDF_BYTES,
            max_size_bytes=1024,
        )


def test_rejects_content_that_does_not_match_declared_type():
    with pytest.raises(InvalidFileTypeError):
        validate_upload(
            filename="post.pdf",
            content_type="application/pdf",
            file_bytes=b"this is not actually a pdf",
            max_size_bytes=1024,
        )


def test_rejects_file_over_size_limit():
    with pytest.raises(FileTooLargeError):
        validate_upload(
            filename="post.pdf",
            content_type="application/pdf",
            file_bytes=PDF_BYTES,
            max_size_bytes=4,
        )
