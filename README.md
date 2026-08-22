# SocialLens

**Understand. Improve. Engage.**

SocialLens extracts text from uploaded PDFs and images (with OCR fallback
for scanned documents), analyzes the content as social-media copy, scores
it across several dimensions, and generates an improved rewrite.

> **Status:** Phase 2 of 10 complete — database, models, repositories, and
> the documents/analyses API are live. Documents can be uploaded (validated,
> stored, recorded), listed, and fetched; analyses can be listed and
> fetched once they exist. Extraction, OCR, AI analysis, and the frontend
> UI land in later phases. See [docs/decisions.md](docs/decisions.md) for
> the engineering log.

## 1. Overview

Upload a PDF or image containing social-media content (a LinkedIn post, a
tweet screenshot, an Instagram caption). SocialLens extracts the text,
figures out whether OCR is needed, analyzes the content with a mix of
deterministic metrics and an LLM, and returns a score, strengths,
weaknesses, actionable recommendations, and an improved rewrite.

## 2. Features

- Drag-and-drop or file-picker upload for PDF / PNG / JPG (max 20 MB)
- Native PDF text extraction (PyMuPDF) with automatic OCR fallback for
  scanned documents
- Image OCR via Tesseract, with basic preprocessing
- Deterministic content metrics (word/sentence counts, hashtags, mentions,
  CTA presence, readability, ...) blended with LLM semantic scoring
- Score breakdown (overall, hook, clarity, engagement, CTA, readability)
- Strengths, weaknesses, and actionable recommendations
- AI-generated improved rewrite, with copy-to-clipboard
- Analysis history and a lightweight insights dashboard
- Responsive, accessible UI

## 3. Architecture

Modular monolith: one FastAPI backend, one Next.js frontend, SQLite
database, local temp storage for uploads. No microservices, queues, or
container orchestration. Full diagrams in
[docs/architecture.md](docs/architecture.md); decision rationale in
[docs/decisions.md](docs/decisions.md).

## 4. Technology stack

**Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui,
Lucide icons, Recharts, React Hook Form + Zod, TanStack Query.

**Backend:** Python, FastAPI, Pydantic, SQLAlchemy, SQLite, Alembic,
PyMuPDF, Pillow, OpenCV, Tesseract OCR (via pytesseract), Gemini API.

## 5. Processing pipeline

`PDF/image → validate → native text extraction attempt → OCR fallback if
needed → normalize text → segment into posts → deterministic metrics +
LLM analysis → blended scores → persist → results`. Details and sequence
diagram in [docs/architecture.md](docs/architecture.md).

## 6. OCR strategy

Tesseract (free, open source) via `pytesseract`. Images go through
grayscale/contrast/threshold preprocessing before OCR. Scanned PDF pages
are rendered to images (PyMuPDF) and OCR'd page-by-page. OCR confidence is
captured and surfaced (`extraction_method`, `confidence`).

## 7. AI analysis strategy

All Gemini calls go through a single `LLMProvider` abstraction
(`app/providers/llm/`). The model is asked for structured JSON only,
validated with Pydantic before use; a malformed response is handled
gracefully rather than crashing the request. Prompts live in
`backend/app/prompts/` as versioned text files, not inline strings.

## 8. Database design

SQLite for local dev and the initial deployment. Two tables: `documents`
(upload metadata + extracted text) and `analyses` (scores, tone,
sentiment, strengths/weaknesses/recommendations, improved content). Schema
is dialect-neutral so a future move to Postgres is a connection-string
change — see [docs/decisions.md](docs/decisions.md).

## 9. API overview

REST API under `/api/v1`. Currently:

- `GET /api/v1/health` — liveness check
- `POST /api/v1/documents` — upload a PDF/PNG/JPG (multipart), validated and
  stored; creates a `documents` row with `status=uploaded`
- `GET /api/v1/documents` — list uploaded documents (paginated: `skip`, `limit`)
- `GET /api/v1/documents/{id}` — fetch one document, including extracted text once populated
- `GET /api/v1/analyses` — list analyses (paginated: `skip`, `limit`)
- `GET /api/v1/analyses/{id}` — fetch one analysis

Planned (later phases): `POST /documents/{id}/analyze` (triggers
extraction + AI analysis — added once the extraction/OCR/analysis
pipeline exists). Full interactive docs at `http://localhost:8000/docs`
(FastAPI's auto-generated OpenAPI UI) once the backend is running.

## 10. Local setup

Prerequisites: Node.js 20+, Python 3.11+ (developed against 3.14),
[Tesseract OCR](https://github.com/tesseract-ocr/tesseract) installed and
on `PATH` (needed starting Phase 3, not for the current scaffold).

```bash
git clone <repo-url>
cd SocialLens
```

## 11. Environment variables

Copy the example files and fill in values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

| Variable | Where | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | backend | Gemini API key. Server-side only, never sent to the frontend. |
| `DATABASE_URL` | backend | SQLAlchemy connection string. Defaults to local SQLite. |
| `CORS_ORIGINS` | backend | Comma-separated list of allowed frontend origins. |
| `TESSERACT_CMD` | backend | Optional path to the `tesseract` binary if not on `PATH` (common on Windows). |
| `NEXT_PUBLIC_API_URL` | frontend | Base URL of the backend API. |

## 12. Running the frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:3000`.

## 13. Running the backend

```bash
cd backend
python -m venv venv
./venv/Scripts/activate       # Windows
# source venv/bin/activate    # macOS/Linux
pip install -r requirements-dev.txt
alembic upgrade head           # create/update the SQLite schema
uvicorn app.main:app --reload --port 8000
```

API at `http://localhost:8000`, interactive docs at
`http://localhost:8000/docs`.

To create a new migration after changing a model in `app/models/`:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

## 14. Running tests

```bash
cd backend
pytest
```

Covers file validation (extension/MIME/signature/size), the documents and
analyses repositories, and the documents/analyses API endpoints (upload,
list, get, 404s, validation errors) — each test runs against an isolated
in-memory SQLite database, not the dev `socialens.db`. Frontend test setup
lands alongside the components it covers (Phase 8).

## 15. Docker instructions

_Added in Phase 9._

## 16. Deployment instructions

_Added in Phase 9._ Target: free/low-cost tiers (e.g. Render/Railway for
the backend, Vercel for the frontend).

## 17. Known limitations

- Scores are content-quality heuristics blended with LLM judgment, not a
  statistically validated prediction of real engagement (likes, shares,
  reach). This is documented in-app, not just here.
- Single-node SQLite: not intended for concurrent multi-writer production
  load.
- OCR accuracy depends on scan/photo quality; no cloud OCR fallback.

## 18. Future improvements

- Cloud OCR provider as an alternative `OCRProvider` implementation
- Postgres for multi-user deployments
- Additional LLM provider behind the existing `LLMProvider` interface
- Batch/multi-document analysis

## Project structure

```
SocialLens/
├── backend/           FastAPI app (see backend/README structure in docs/architecture.md)
├── frontend/           Next.js app (App Router)
├── docs/               architecture.md, api.md, decisions.md, approach.md
└── README.md           you are here
```

## License

Educational/assessment project.
