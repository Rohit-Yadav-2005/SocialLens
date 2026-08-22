# Engineering decisions

Running log of notable decisions and why they were made. Newest first.

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
