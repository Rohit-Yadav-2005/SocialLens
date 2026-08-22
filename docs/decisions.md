# Engineering decisions

Running log of notable decisions and why they were made. Newest first.

## Extraction runs synchronously inside the upload request

`POST /api/v1/documents` validates, stores, *and* extracts (native text or
OCR fallback) before responding — there's no separate "process" step or
polling. A single document takes low single-digit seconds even with OCR,
well within a normal request timeout, and this keeps the pipeline
trivially easy to reason about (no task queue, no job status to poll — see
[architecture.md](architecture.md)). The AI-analysis step (Phase 4) is a
separate `POST /documents/{id}/analyze` call, since that's a materially
slower, separately-retryable operation.

## Failed documents are kept, not discarded

If extraction fails (corrupted file, no readable text, OCR engine error),
the `documents` row is *not* deleted — it's updated to `status=failed`
with `error_message` set, and the same error is also returned to the
caller as an HTTP error response. This means a failed upload still shows
up in history (so the user can see *what* they tried and *why* it failed)
while the client still gets an immediate, specific error to display.
Purely invalid uploads (wrong file type, over the size limit) are rejected
*before* a document row is created, since those never got far enough to
be a real attempt worth recording.

## PDF opened from bytes, not by filename

`ExtractionService._extract_pdf` reads the temp file's bytes and calls
`pymupdf.open(stream=..., filetype="pdf")` rather than
`pymupdf.open(path)`. Opening by filename was found (via a failing test)
to keep an OS-level file handle open on Windows even after PyMuPDF raises
on a malformed PDF, which then blocked deleting the temp file in the
`finally` block. Opening from an in-memory buffer sidesteps the OS handle
entirely.

## `is_meaningful_text` heuristic, not a strict content check

The native-vs-OCR fallback decision (and the final "did we get anything
usable" check) both use one small heuristic: strip the text, require at
least 15 non-whitespace characters, and require at least 30% of those to
be alphanumeric. It deliberately does *not* penalize hashtags, emoji, or
punctuation-heavy text — a short, real social post ("Big news today
#launch #excited #team") should pass, while a blank/scanned page or
garbled OCR noise ("... --- ___ ///") should not. It's a heuristic, not a
classifier — documented as a known limitation rather than tuned further,
per the "don't over-engineer" principle.

## No deskewing in OCR preprocessing

Preprocessing covers grayscale, upscaling small images, contrast
enhancement (Otsu binarization via OpenCV), and EXIF auto-rotation.
Deskewing (correcting a rotated/tilted scan) was left out: it's the one
preprocessing step in the spec's suggested list that's genuinely fiddly to
get right without a dedicated library, and the assessment's realistic
inputs (screenshots, phone photos of a screen) are rarely skewed enough to
need it. Noted here as a known gap rather than silently dropped.

## Testing strategy: mock the OCR engine, keep one real-engine test

Every extraction/OCR test monkeypatches `TesseractOCRProvider.extract`
(or injects a fake `OcrService`) so the suite passes in any environment,
regardless of whether the Tesseract binary is installed — this dev
machine didn't have it installed when this phase was built. One test
(`test_ocr_real_engine.py`) exercises the actual binary and is
auto-skipped via `pytest.mark.skipif` when it can't be found, so it comes
alive automatically in an environment (like CI, or after a developer
installs Tesseract locally) that has it.

## UUID string primary keys, not autoincrement integers

`documents.id` and `analyses.id` are UUID4 strings generated in Python
(`default=lambda: str(uuid.uuid4())`), not database-assigned integers.
IDs are handed straight to the frontend as opaque strings and never need
to leak "how many documents exist" the way a sequential integer would.
It also means a document's ID is known immediately after construction,
before the INSERT — convenient for computing its temp-file path.

## Temp file path is derived, not stored

The `documents` table intentionally has no `file_path` column (matching
the spec's schema exactly). `DocumentService.temp_path_for()` derives the
path deterministically as `temp/{document.id}{extension}`, with the
extension read back off `document.filename`. One less place for a stored
path to go stale or point at a file that was already cleaned up.

## Status enum values

`DocumentStatus` covers `uploaded → processing → processed → analyzing →
analyzed`, plus `failed`. This is slightly more granular than the spec's
schema strictly requires, but each value maps to a real pipeline stage
that a later phase (extraction, then analysis) needs to set — adding it
now avoids a schema migration per phase. `extraction_method` is a separate
nullable enum (`native` / `ocr`) rather than folded into status, since a
document can be `processed` via either path and the frontend needs to
show which one was used.

## Repositories return ORM objects, not schemas

`DocumentRepository`/`AnalysisRepository` return SQLAlchemy model
instances; converting to a Pydantic response schema happens once, at the
API boundary (`DocumentResponse.model_validate(document)`), not inside
the repository. Keeps the repository layer a thin, reusable data-access
layer that services can also consume without paying for a schema
round-trip they don't need.

## Alembic reads DATABASE_URL from app settings, not alembic.ini

`alembic/env.py` calls `get_settings().database_url` instead of using the
static `sqlalchemy.url` in `alembic.ini`. One source of truth for the
connection string — changing `DATABASE_URL` in `.env` is enough; nothing
in `alembic.ini` needs to be kept in sync by hand.

## Python 3.14 for the backend

Only Python 3.14 was available in the dev environment. Verified before
scaffolding that every planned dependency (FastAPI, SQLAlchemy, PyMuPDF,
Pillow, opencv-python-headless, pytesseract, google-genai, Alembic, Ruff,
Black, pytest) publishes prebuilt wheels for `cp314-win_amd64`, so no
compiler toolchain is required to install them. If deploying to a host
that only offers Python 3.11/3.12, the same requirements.txt is expected to
work unchanged since nothing pins to 3.14-only syntax.

## Modular monolith, no task queue

Extraction, OCR, and LLM analysis all run synchronously within the request
that triggers them. A single document takes low single-digit seconds to
process, well within a normal HTTP timeout. Introducing Celery/RabbitMQ/
Redis for this workload would add operational surface area without solving
a real latency or throughput problem — see [architecture.md](architecture.md).

## SQLite now, Postgres-compatible later

Models avoid SQLite-specific types and rely on SQLAlchemy's dialect-neutral
column types. `DATABASE_URL` is the only thing that changes to move to
Postgres; no query rewrites anticipated. Alembic migrations are written
against the ORM models, not raw SQLite DDL, for the same reason.

## Provider abstractions for OCR and LLM

`app/providers/ocr/base.py` and `app/providers/llm/base.py` define small
interfaces (`extract(image) -> OcrResult`, `analyze(text) -> AnalysisResult`)
with exactly one concrete implementation each (Tesseract, Gemini). This
keeps the future swap points (cloud OCR, another LLM vendor) as a single new
file + a config flag, without building unused providers today.

## Temp files over object storage

Uploaded files are written to `backend/temp/`, processed, and deleted
immediately after extraction succeeds (or fails). Nothing about this
project needs durable storage of the original binary — the extracted text
and analysis are what get persisted.
