"""Text normalization and a lightweight "is this real content" heuristic
that drives the native-vs-OCR fallback decision.
"""

import re

_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")
_MULTISPACE_RE = re.compile(r"[ \t]+")
_MULTINEWLINE_RE = re.compile(r"\n{3,}")

MIN_MEANINGFUL_CHARS = 15


def normalize_text(raw: str) -> str:
    """Collapse whitespace and stray control characters while preserving
    paragraph breaks. Hashtags, @mentions, URLs, and emoji are untouched —
    normalization never rewrites word content, only whitespace.
    """
    text = raw.replace("\r\n", "\n").replace("\r", "\n")
    text = _CONTROL_CHARS_RE.sub("", text)
    text = _MULTISPACE_RE.sub(" ", text)
    text = "\n".join(line.strip() for line in text.split("\n"))
    text = _MULTINEWLINE_RE.sub("\n\n", text)
    return text.strip()


def is_meaningful_text(text: str, *, min_chars: int = MIN_MEANINGFUL_CHARS) -> bool:
    """True if `text` looks like real extracted content rather than noise
    from a blank/scanned page or a failed OCR pass.
    """
    stripped = text.strip()
    if len(stripped) < min_chars:
        return False
    alnum_count = sum(1 for ch in stripped if ch.isalnum())
    return alnum_count >= min_chars * 0.3
