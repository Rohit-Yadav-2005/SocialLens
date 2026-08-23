"""Unit tests for RateLimiter, constructed as a fresh standalone instance
(not the app-level singletons in app.core.rate_limit, which are disabled
in the `client` fixture for the rest of the suite — see conftest.py).
"""

from unittest.mock import Mock

import pytest

from app.core.exceptions import RateLimitExceededError
from app.core.rate_limit import RateLimiter


def _request(ip: str = "1.2.3.4") -> Mock:
    request = Mock()
    request.client.host = ip
    return request


def test_allows_requests_within_the_limit():
    limiter = RateLimiter(max_requests=3, window_seconds=60)
    for _ in range(3):
        limiter(_request())  # should not raise


def test_blocks_once_the_limit_is_exceeded():
    limiter = RateLimiter(max_requests=2, window_seconds=60)
    limiter(_request())
    limiter(_request())

    with pytest.raises(RateLimitExceededError):
        limiter(_request())


def test_tracks_each_client_ip_independently():
    limiter = RateLimiter(max_requests=1, window_seconds=60)
    limiter(_request("1.1.1.1"))

    limiter(_request("2.2.2.2"))  # a different IP has its own budget


def test_old_hits_outside_the_window_are_forgotten(monkeypatch):
    import app.core.rate_limit as rate_limit_module

    current_time = [1000.0]
    monkeypatch.setattr(rate_limit_module, "monotonic", lambda: current_time[0])

    limiter = RateLimiter(max_requests=1, window_seconds=10)
    limiter(_request())

    with pytest.raises(RateLimitExceededError):
        limiter(_request())

    current_time[0] += 11  # advance past the window
    limiter(_request())  # should not raise — the earlier hit has expired


def test_falls_back_to_unknown_when_request_has_no_client():
    request = Mock()
    request.client = None
    limiter = RateLimiter(max_requests=1, window_seconds=60)

    limiter(request)  # should not raise
