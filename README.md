# SocialLens

**Understand. Improve. Engage.**

SocialLens extracts text from uploaded PDFs and images (with OCR fallback
for scanned documents), analyzes the content as social-media copy, scores
it across several dimensions, and generates an improved rewrite.

> **Status:** Phase 8 of 10 complete — a dedicated testing pass across
> the whole app: 136 backend tests (pytest), 71 frontend unit/component
> tests (Vitest + React Testing Library), and one real end-to-end
> happy-path test (Playwright) driving the actual app through a real
> browser. Found and fixed two real bugs along the way (dead/incorrect
> error-state logic in the processing UI, unused dead code in the
> document repository) rather than just reporting them. Phases 9-10
> (Docker, final docs) remain. See
> [docs/decisions.md](docs/decisions.md) for the engineering log.

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

**Frontend structure:** `app/` holds routes (App Router), `components/`
is split by concern (`layout/`, `upload/`, `analysis/`, `landing/`,
`history/`, `insights/`, `providers/`, `ui/` for shadcn primitives),
`lib/api.ts` is the one place that calls the backend (typed, throws a
typed `ApiError`), `hooks/` holds TanStack Query orchestration, `types/`
mirrors the backend's Pydantic schemas, and `validations/` holds the Zod
client-side checks. No frontend component calls `fetch` directly —
everything goes through `lib/api.ts`.

**History** (`/history`, `useHistory`): joins `GET /documents` with
`GET /analyses` client-side — documents carry filename/status/date,
analyses carry the score, and a document can exist without an analysis
yet (shown as `—`). Search (by filename) and column sort are local state
over the already-fetched rows; no backend involvement, since the data
volume doesn't warrant it (see docs/decisions.md).

**Insights** (`/insights`, `useInsights`): a single `GET /insights` call.
Empty state when `total_analyses === 0`; a separate, narrower empty state
just for the trend chart when there's data but fewer than 2 points (a
"trend" of one point isn't meaningful, but the stat tiles still show).

**Results dashboard** (`/analyze/[documentId]`, `components/analysis/`):
fetches the document and its analysis by id (`useDocumentAnalysis`,
priming the cache from the just-completed analyze mutation so navigating
there right after an analysis is instant, or fetching fresh on a direct
visit/reload). Renders the overall score as a Recharts radial gauge, the
five sub-scores as a Recharts radar chart plus individual cards,
deterministic metrics, strengths/weaknesses/recommendations, and an
original-vs-improved comparison (two-column desktop, stacked mobile) with
copy-to-clipboard. Loading, error (e.g. not-analyzed-yet, not-found), and
empty (no strengths/weaknesses returned) states are all handled
explicitly — nothing is fabricated client-side.

## 4. Technology stack

**Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui,
Lucide icons, Recharts, React Hook Form + Zod, TanStack Query. Testing:
Vitest + React Testing Library (unit/component), Playwright (E2E).

**Backend:** Python, FastAPI, Pydantic, SQLAlchemy, SQLite, Alembic,
PyMuPDF, Pillow, OpenCV, Tesseract OCR (via pytesseract), Gemini API.
Testing: pytest.

## 5. Processing pipeline

`PDF/image → validate → native text extraction attempt → OCR fallback if
needed → normalize text → segment into posts → deterministic metrics +
LLM analysis → blended scores → persist → results`. Details and sequence
diagram in [docs/architecture.md](docs/architecture.md).

## 6. OCR strategy

Tesseract (free, open source) via `pytesseract`, behind an `OCRProvider`
interface (`app/providers/ocr/`) with exactly one implementation today.
Images go through EXIF auto-rotation, grayscale, upscaling (if small),
contrast enhancement, and Otsu binarization before OCR (`OcrService`,
`app/services/ocr_service.py`) — deskewing is intentionally out of scope,
see [docs/decisions.md](docs/decisions.md). Scanned PDF pages are rendered
to images (PyMuPDF, 200 DPI) and OCR'd page-by-page, only for pages whose
native text extraction didn't produce anything meaningful — a mixed
native/scanned PDF only pays the OCR cost where it's actually needed.
`extraction_method` (`native`/`ocr`) and `ocr_confidence` are persisted on
the document and returned by the API.

## 7. AI analysis strategy

All Gemini calls go through a single `LLMProvider` abstraction
(`app/providers/llm/`) — `GeminiProvider` is the only implementation, kept
swappable for a future provider. The model is asked for structured JSON
only (`response_schema` set to the Pydantic contract), and the raw text is
still independently `json.loads`'d and `model_validate`'d before use —
belt and suspenders, since a malformed or empty response must never crash
the request. The prompt lives in `backend/app/prompts/content_analysis.txt`
as a versioned text file, not an inline string, and explicitly instructs
the model not to invent engagement statistics or guarantee outcomes.

**Scoring is hybrid, not purely AI-driven.** `ScoringService`
(`app/services/scoring_service.py`) computes deterministic metrics (word/
sentence/hashtag/mention/URL/emoji counts, CTA-phrase detection, a Flesch
Reading Ease approximation) independently of the LLM, then blends them
with the AI's judgment:

| Score | Formula |
|---|---|
| `readability_score` | 100% deterministic (Flesch-based) — the AI isn't asked to judge this |
| `hook_score` / `clarity_score` / `engagement_score` | 100% AI — no reliable deterministic proxy exists |
| `cta_score` | 30% deterministic (CTA-phrase presence) + 70% AI (CTA quality) |
| `overall_score` | 40% deterministic metrics + 60% AI, per the assessment spec |

These weights are an initial, transparent choice — not a statistically
tuned model — and that limitation is stated in the UI, not hidden. See
[docs/decisions.md](docs/decisions.md) for the full reasoning per score.

**Failure handling:** a missing `GEMINI_API_KEY`, a failed request, an
empty response, non-JSON output, or a schema-violating response are each
caught and surfaced as a specific error code (`AI_ANALYSIS_FAILED` /
`INVALID_AI_RESPONSE`) rather than a stack trace. On failure, no
`analyses` row is created and the document's status reverts to
`processed` (extraction is untouched) so the caller can retry.

## 8. Database design

SQLite for local dev and the initial deployment. Two tables: `documents`
(upload metadata + extracted text) and `analyses` (scores, tone,
sentiment, strengths/weaknesses/recommendations, improved content, and the
deterministic `metrics` computed at analysis time — persisted rather than
recomputed on every read). Schema is dialect-neutral so a future move to
Postgres is a connection-string change — see
[docs/decisions.md](docs/decisions.md).

## 9. API overview

REST API under `/api/v1`. Currently:

- `GET /api/v1/health` — liveness check
- `POST /api/v1/documents` — upload a PDF/PNG/JPG (multipart): validated,
  stored temporarily, and run through extraction (native text, with
  automatic OCR fallback) synchronously before responding. Returns the
  document with `extracted_text`, `extraction_method`, `ocr_confidence`,
  and `status` (`processed` on success, `failed` with `error_message` set
  if extraction couldn't produce usable text)
- `GET /api/v1/documents` — list uploaded documents (paginated: `skip`, `limit`)
- `GET /api/v1/documents/{id}` — fetch one document, including extracted text and extraction metadata
- `POST /api/v1/documents/{id}/analyze?platform=generic` — run content
  analysis on an already-extracted document (`platform` is one of
  `linkedin`, `instagram`, `twitter`, `generic`, and only affects the
  prompt's framing — no social platform APIs are called). Returns the
  created analysis with the blended scores, tone, sentiment, target
  audience, strengths, weaknesses, recommendations, improved rewrite, and
  deterministic `metrics`
- `GET /api/v1/documents/{id}/analysis` — the most recent analysis for a
  document (404 if it hasn't been analyzed yet). Lets the results page
  fetch by document id alone, whether it just finished analyzing or the
  page was reloaded/opened directly
- `GET /api/v1/analyses` — list analyses (paginated: `skip`, `limit`)
- `GET /api/v1/analyses/{id}` — fetch one analysis
- `GET /api/v1/insights` — aggregate stats across every analysis: total
  count, average overall/hook/CTA scores (`null` when there's no data,
  never a fabricated `0`), a chronological score trend, and weakness
  categories (keyword-matched from the AI's free-form weakness text)
  ranked by frequency

Full interactive docs at `http://localhost:8000/docs` (FastAPI's
auto-generated OpenAPI UI) once the backend is running.

## 10. Local setup

Prerequisites: Node.js 20+, Python 3.11+ (developed against 3.14),
[Tesseract OCR](https://github.com/tesseract-ocr/tesseract) installed and
on `PATH`.

```bash
git clone <repo-url>
cd SocialLens
```

**Installing Tesseract:**

- **Windows:** download the installer from the
  [UB-Mannheim Tesseract build](https://github.com/UB-Mannheim/tesseract/wiki)
  (the most commonly used Windows build) and run it. If it's not on `PATH`
  afterward, set `TESSERACT_CMD` in `backend/.env` to the install path,
  typically `C:\Program Files\Tesseract-OCR\tesseract.exe`.
- **macOS:** `brew install tesseract`
- **Linux (Debian/Ubuntu):** `sudo apt-get install tesseract-ocr`

Native PDF text extraction and file validation work without Tesseract
installed — it's only needed for scanned PDFs and image uploads. Without
it, those uploads fail gracefully with a clear `OCR_FAILED` error instead
of crashing.

## 11. Environment variables

Copy the example files and fill in values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

| Variable | Where | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | backend | Gemini API key. Server-side only, never sent to the frontend. Without it, `/analyze` fails gracefully with `AI_ANALYSIS_FAILED`. |
| `GEMINI_MODEL` | backend | Optional override; defaults to `gemini-2.5-flash`. |
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

Opens at `http://localhost:3000`. Requires the backend running at the URL
in `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`) for the
`/analyze` page to work — the landing, history, and insights pages don't
need it.

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

**Backend (pytest, 136 tests):**

```bash
cd backend
pytest
```

Covers file validation, PDF extraction and the native-vs-OCR decision
logic, OCR preprocessing and provider error translation, deterministic
scoring (metrics computation and the hybrid blend formula), the Gemini
provider (request/response handling, JSON/schema validation), every API
endpoint's happy and error paths, insights aggregation, and the global
exception handler (confirms an unhandled error never leaks internals to
the client). Runs against an isolated in-memory SQLite database with the
OCR engine and LLM provider mocked, so it passes without Tesseract
installed and without a real `GEMINI_API_KEY` or network access. One
additional test (`test_ocr_real_engine.py`) exercises the real Tesseract
binary and is skipped automatically when it isn't found — installed here,
so it runs for real rather than skipping.

**Frontend unit/component tests (Vitest + React Testing Library, 71 tests):**

```bash
cd frontend
npm test          # one-shot run
npm run test:watch
```

Covers client-side file validation, the API client's error handling
(network failure, malformed error bodies, backend error codes), the
Dropzone (file picker, drag-and-drop, validation feedback), processing
stage transitions (including which phase failed on error), result
rendering (`ResultsDashboard` with real fixture data, including the
Recharts-based sections), error states, copy-to-clipboard (including the
rejected-permission path), and History's search/sort logic.

**End-to-end (Playwright, 1 test):**

```bash
cd frontend
npm run test:e2e
```

The required happy-path test: upload → process → results, driven through
the real app in a real browser (not jsdom). Backend responses are mocked
at the network layer (`page.route()`) rather than running a real
FastAPI + Gemini + Tesseract stack, so it's fast and deterministic —
real backend behavior has its own, much larger test suite already.
Auto-starts the dev server if one isn't already running.

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
- The deterministic/AI blend weights (see section 7) are an initial,
  documented choice, not a statistically tuned or validated model.
- CTA and readability heuristics are simple (phrase-matching, Flesch
  approximation) — they won't catch every real-world CTA or reading-level
  edge case.
- The results dashboard doesn't show weakness "severity" (spec's
  suggested field) — the AI response doesn't include one, and inventing a
  fake severity level would be worse than omitting it.
- TanStack Query is configured with `retry: false` app-wide (see
  [docs/decisions.md](docs/decisions.md)) — a failed request surfaces
  immediately rather than retrying automatically.
- "Common weaknesses" on the Insights page is a keyword-matched
  categorization of the AI's free-form weakness text, not something the
  AI was asked to classify directly — a real weakness can go
  uncategorized if it doesn't match a known keyword. Documented in the UI
  itself, not just here.
- Insights' "average improvement" (spec's suggested stat) isn't shown —
  it would require re-scoring `improved_content` with a second AI call,
  which nothing in this phase asked for or justified adding. The stats
  shown (total, average overall/hook/CTA) are all real, direct
  aggregates.
- History's document↔analysis join and Insights' aggregation both read
  the *entire* documents/analyses tables unpaged — reasonable at
  assessment scale, would need real pagination/aggregation-in-SQL before
  scaling past a few thousand rows.
- Test coverage isn't exhaustive — the goal (per this phase's own
  instructions) was meaningful coverage of the highest-value paths, not
  100%. The one E2E test covers the happy path only; error-state E2E
  coverage is handled at the component-test level instead (see
  `processing-stages.test.tsx`, `results-error.test.tsx`).

## 18. Future improvements

- Cloud OCR provider as an alternative `OCRProvider` implementation
- Postgres for multi-user deployments
- Additional LLM provider behind the existing `LLMProvider` interface
- Batch/multi-document analysis
- Tone/length-controlled content regeneration (spec section 17) via a
  second prompt (`content_improvement.txt`), once the frontend has controls
  for it — the core analyze flow already returns one improved rewrite

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
