"""Upload validation: extension, declared MIME type, and actual file signature.

Never trust the filename or declared Content-Type alone — both are
attacker-controlled. The magic-byte check catches a mismatched or renamed
file before it reaches the extraction pipeline.
"""

from dataclasses import dataclass

from app.core.exceptions import FileTooLargeError, InvalidFileTypeError

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
ALLOWED_MIME_TYPES = {"application/pdf", "image/png", "image/jpeg"}

_SIGNATURES: dict[str, tuple[bytes, ...]] = {
    "application/pdf": (b"%PDF",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/jpeg": (b"\xff\xd8\xff",),
}


@dataclass(frozen=True)
class ValidatedUpload:
    extension: str
    content_type: str


def extension_of(filename: str) -> str:
    if "." not in filename:
        return ""
    return "." + filename.rsplit(".", 1)[-1].lower()


def validate_upload(
    *, filename: str, content_type: str, file_bytes: bytes, max_size_bytes: int
) -> ValidatedUpload:
    if len(file_bytes) > max_size_bytes:
        raise FileTooLargeError(f"File exceeds the {max_size_bytes // (1024 * 1024)}MB size limit.")

    extension = extension_of(filename)
    if extension not in ALLOWED_EXTENSIONS:
        raise InvalidFileTypeError(
            f"Unsupported file extension '{extension or '(none)'}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}."
        )

    if content_type not in ALLOWED_MIME_TYPES:
        raise InvalidFileTypeError(
            f"Unsupported content type '{content_type}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_MIME_TYPES))}."
        )

    signatures = _SIGNATURES[content_type]
    if not any(file_bytes.startswith(sig) for sig in signatures):
        raise InvalidFileTypeError(
            "File contents do not match the declared file type. "
            "The file may be corrupted or mislabeled."
        )

    return ValidatedUpload(extension=extension, content_type=content_type)
