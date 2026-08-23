"""Minimal in-process rate limiting for the two unauthenticated endpoints
that cost real resources: document upload (extraction/OCR work) and
analysis (a paid Gemini API call per request).

This is a fixed-window counter keyed by client IP, kept entirely in
memory — no Redis, no new dependency, consistent with the rest of the
app's "no infrastructure beyond what's needed" approach (see
docs/architecture.md). It does not survive a restart and does not
coordinate across multiple worker processes; it's a basic abuse guard
for a single-instance deployment, not a substitute for real
authentication. See docs/decisions.md.
"""

from collections import defaultdict
from time import monotonic

from fastapi import Request

from app.core.exceptions import RateLimitExceededError


class RateLimiter:
    def __init__(self, *, max_requests: int, window_seconds: float):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._hits: dict[str, list[float]] = defaultdict(list)

    def __call__(self, request: Request) -> None:
        client_ip = request.client.host if request.client else "unknown"
        now = monotonic()
        window_start = now - self.window_seconds

        hits = self._hits[client_ip]
        while hits and hits[0] < window_start:
            hits.pop(0)

        if len(hits) >= self.max_requests:
            raise RateLimitExceededError(
                "Too many requests. Please wait a few minutes and try again."
            )

        hits.append(now)

    def reset(self) -> None:
        """Test-only: clear all tracked hits."""
        self._hits.clear()


# Stricter on /analyze than on upload — it's the one that spends real
# Gemini API quota per call.
upload_rate_limiter = RateLimiter(max_requests=20, window_seconds=300)
analyze_rate_limiter = RateLimiter(max_requests=10, window_seconds=300)
