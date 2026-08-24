# Python 3.12: the dev environment used 3.14 (see docs/decisions.md), but
# nothing in the codebase requires 3.14-only syntax, and 3.12 is a more
# conservative, widely-available target for a deployed image.
FROM python:3.12-slim

# tesseract-ocr: the OCR engine itself (pytesseract just shells out to it).
# libglib2.0-0: opencv-python-headless still dynamically links against glib
# at runtime even though it doesn't need a display/X11 (that's what
# "headless" removes) — omitting it fails at `import cv2` inside the
# container, not at build time.
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/temp /app/data \
    && useradd --create-home --shell /usr/sbin/nologin appuser \
    && chown -R appuser:appuser /app

USER appuser

ENV PYTHONUNBUFFERED=1
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8000}/api/v1/health')" || exit 1

# alembic upgrade head runs on every container start so the schema is
# always current without a separate manual migration step — standard for
# a deployed single-instance service (see docs/decisions.md).
#
# --proxy-headers --forwarded-allow-ips='*': the container is only ever
# reachable through the deploy platform's own ingress proxy (Render/
# Railway/Fly all work this way — there's no direct path to the
# container from the public internet), so trusting that one hop's
# X-Forwarded-For is safe and necessary: without it, every request's
# client.host resolves to the proxy's own address, which would silently
# turn the per-IP rate limiter (app/core/rate_limit.py) into one shared
# limit across every real user. Trusting '*' would be wrong for a
# directly-internet-facing server (header spoofing) — it's correct here
# specifically because that path doesn't exist in this deployment shape.
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'
