# Engineering decisions

Running log of notable decisions and why they were made. Newest first.

## Testing stack: Vitest + React Testing Library, plus one Playwright test

Vitest (not Jest) for unit/component tests — it shares Vite's transform
pipeline, needs near-zero config for a TypeScript + React 19 project, and
is the de facto default for new Vite-adjacent projects. React Testing
Library on top, since it tests behavior (what's on screen, what a user
can click) rather than component internals.

For the one required end-to-end test, Playwright drives the *real* app in
a *real* browser rather than simulating the flow in jsdom — this is the
one test in the suite that would have caught two real bugs found earlier
by manual browser testing (Phase 5's Base UI `nativeButton` warning,
Phase 6's TanStack retry/focus-pause bug) automatically. Scoped to
exactly one test, per the assessment's "at least one" ask and the
project's "don't over-engineer" principle — broader E2E coverage would
duplicate what the component tests and backend integration tests already
cover more cheaply.

## E2E test mocks the backend at the network layer, not a real stack

`page.route()` intercepts the frontend's calls to `/api/v1/*` and returns
canned JSON rather than running a real FastAPI + Gemini + Tesseract
backend during the test. This E2E test's job is to verify the frontend's
own wiring — component composition, TanStack Query, client-side routing,
rendering — not to re-prove backend correctness, which the backend's 136
pytest tests already do far more thoroughly and cheaply. It also means
the test needs no `GEMINI_API_KEY`, no Tesseract, and no backend process
running at all, so it's fast and fully deterministic.

## Both Vitest and Playwright needed non-default process/pool settings

Vitest's default "forks" pool (spawns child OS processes to isolate test
files) hung indefinitely on worker startup in this sandboxed dev
environment — fixed with `pool: "threads"` in `vitest.config.mts`
(worker threads instead of child processes). Separately, Playwright's
`webServer` auto-spawn of `npm run dev` timed out the same way, even
though running `npm run dev` directly worked fine in under 2 seconds —
same underlying class of issue (this specific sandbox restricting some
child-process-spawning paths), unrelated to Vitest's. The `webServer`
config block was kept as-is (it's the correct setup for a normal
machine, and `reuseExistingServer: true` already provides a working
fallback — start the dev server yourself first, and Playwright reuses
it) rather than removed, since removing it would only trade convenience
on a normal machine for no benefit here.

## Two real bugs found and fixed while writing tests, not just reported

1. **`ProcessingStages`'s error-state logic was dead and wrong.** Writing
   a test for the "analysis failed after upload succeeded" case revealed
   two problems at once: `analyze/page.tsx` never actually rendered
   `ProcessingStages` when `stage === "error"` (so the branch was
   unreachable), and even if it had, the logic didn't know *which* phase
   had failed — it unconditionally showed upload steps as "active" and
   analyze steps as "pending" regardless of whether analysis is what
   actually failed. Fixed by having `useAnalyzeFlow` track `failedPhase`
   (captured from a ref right before the failing call), adding a real
   "failed" step status (distinct from "pending"/"active"/"done"), and
   wiring the page to render `ProcessingStages` during errors too. Now a
   user who gets this far sees exactly how far the pipeline got.
2. **`DocumentRepository.delete()` was dead code.** No API endpoint or
   service method ever called it — nothing in the app exposes document
   deletion. Removed rather than given a test, per "if you're certain
   something is unused, delete it" — a test would have just documented
   that dead code works, not that it's needed.

## jsdom-specific test gotchas worth remembering

- `navigator.clipboard` is a getter-only stub in jsdom 30 — mocking it
  needs `Object.defineProperty(navigator, "clipboard", {...})`, not
  `Object.assign`.
- A `setTimeout` callback that triggers a React state update (like the
  copy-button's "revert after 2s" behavior) needs its timer advancement
  wrapped in `act()` explicitly when using fake timers — Testing
  Library's automatic `act()` wrapping only covers user-event/fireEvent
  calls, not code that runs later on its own.
- `userEvent.upload()` respects the file input's `accept` attribute, the
  same way a real OS file picker would — a wrong-file-type test needs to
  go through a `drop` event instead, since drag-and-drop bypasses `accept`
  entirely (both in real browsers and in this test).
- Base UI's `Button` composed with `render={<Link/>}` reports
  `role="button"`, not the browser-default `role="link"` an `<a href>`
  normally gets — matches its visual/keyboard button semantics
  intentionally, not a bug. Query it in tests accordingly.

## Document.created_at/updated_at also moved to a client-side default

The same bug fixed for `Analysis.created_at` in Phase 6 (SQLite's
`CURRENT_TIMESTAMP` server_default only has second resolution) turned out
to affect `Document` too — found by seeding several documents in quick
succession for History-page testing and noticing the display order
didn't match creation order at all. Applied the identical fix
(`default=lambda: datetime.now(UTC)` instead of `server_default`) to both
`created_at` and `updated_at`. Worth remembering as a pattern: any
`server_default=func.now()` on SQLite is a latent ordering bug waiting
for two writes in the same second — which batch seeding, tests, or a
user uploading several files quickly can all trigger.

## History joins documents + analyses client-side, not via a new endpoint

Unlike the results page (which got a dedicated `GET /documents/{id}/
analysis` endpoint in Phase 6), History reuses the existing `GET
/documents` and `GET /analyses` list endpoints as-is and joins them in
the browser (`useHistory`, mapping `analysis.document_id` to
`overall_score`, first-seen-wins since the list is already newest-first).
No backend change needed here, unlike the results page — the two lists
were already exactly the data required, just not yet combined, and
document-centric semantics (show every upload, analyzed or not) are
naturally what falling back to the documents list gives for free. Fetches
`limit=200` (the backend's max) rather than paginating — the spec
explicitly says "pagination only if necessary," and that's well past
what an assessment-scale history needs.

## "Common weaknesses" categorization is a documented heuristic

The AI returns free-form weakness text, not a category — there was never
a structured field to read a "Weak CTA" label from. Rather than leave a
real, useful signal out entirely, `InsightsService.categorize_weakness`
keyword-matches each weakness string against five categories tied to the
app's own score dimensions (hook, clarity→"unclear messaging",
engagement, CTA, readability). A weakness can match zero, one, or several
categories; unmatched weaknesses simply don't count toward any bucket
rather than being forced into a misleading catch-all. This is the same
category of choice as the CTA-phrase detection already in
`ScoringService` — a transparent, deterministic heuristic over real data,
not something presented as more precise than it is. Both the API
response's framing and the Insights page's caption say "grouped by
keyword," not "AI-categorized."

## "Average improvement" (spec's suggested stat) is not implemented

Spec section 25 lists it alongside average overall/hook/CTA score, but
nothing in the app computes a real value for it — doing so would mean
re-scoring `improved_content` with a second AI call per analysis, which
this phase never asked for and would roughly double Gemini API cost per
analysis for a stat of unclear value. Rather than fabricate a number
(explicitly against this phase's instructions) or invent a strained
reinterpretation of "improvement," it's omitted, with the reasoning
recorded here and in the README rather than silently dropped.

## TanStack Query: `retry: false`, `networkMode: "always"` app-wide

Found via a real, reproducible bug while building the results page:
navigating to a document that doesn't exist rendered a permanently blank
page — no skeleton, no error, nothing — with the query stuck at
`status: "pending"`, `fetchStatus: "paused"` forever. Root cause, traced
into `@tanstack/query-core`'s `retryer.ts`: a scheduled retry only resumes
when `canContinue()` is true, and that check requires
`focusManager.isFocused()` in addition to being online — a retry attempt
scheduled while the tab lacks focus pauses indefinitely waiting for a
`focus` event that may never come. `networkMode: "always"` alone doesn't
fix this (it only bypasses the *online* half of that check). Setting
`retry: false` avoids the retry-scheduling path entirely — a failed
request rejects immediately instead of ever reaching the pausable state.
This app only talks to its own local backend, so automatic retries were
buying little resilience anyway; failing fast and letting the user
explicitly retry (a "Start over" button, a page reload) is more
predictable than a retry that can silently hang. Worth knowing if this
codebase ever adds a genuinely flaky/remote dependency — the fix would
need to be more targeted than a blanket `retry: false` at that point.

## GET /documents/{id}/analysis, not a document_id filter on /analyses

The results page only knows the document id (from the URL) and needs
"the analysis for this document." Rather than extend `GET /analyses` with
a `document_id` query filter (which raises pagination-semantics questions
for a filtered list that's really just fetching one thing), a dedicated
nested endpoint returns the single most-recent `Analysis` for that
document directly — reusing `AnalysisRepository.get_by_document_id`,
already built in Phase 2. 404s with `NOT_FOUND` if the document exists
but hasn't been analyzed yet, distinct from the document itself not
existing (also 404, but the document lookup happens first).

## Analysis.created_at moved from server_default to a Python-side default

A document can be re-analyzed (e.g. for a different platform), so
"the most recent analysis for this document" needed a real ordering
guarantee. SQLite's `CURRENT_TIMESTAMP` (used via `server_default`) only
has second resolution — two analyses created within the same second would
tie, and `ORDER BY created_at DESC LIMIT 1` on a tie is not guaranteed to
return the one that was actually inserted last. Switched `created_at` to
a client-side `default=lambda: datetime.now(UTC)`, which has microsecond
resolution. No migration was needed — Alembic doesn't autogenerate
`server_default` removal by default (`compare_server_default` is off), so
the change is Python/ORM-level only; a fresh `CREATE TABLE` never had a
literal default baked into the DDL beyond what SQLAlchemy already omits.

## Deterministic metrics are persisted on the Analysis row, not recomputed

The `documents`/`analyses` schema originally had no way to return the
deterministic `ContentMetrics` (word count, hashtag count, etc.) that
`ScoringService` already computes internally to blend scores — Phase 4
used them but never exposed them. The results dashboard needs to display
them, and "integrate only with real backend data" ruled out recomputing
them client-side (duplicate logic, risk of drifting from the backend's
actual algorithm). Added a `metrics` JSON column to `analyses`, populated
once at analysis time via `dataclasses.asdict(metrics)` — cheaper than
joining back to the document's `extracted_text` and recomputing on every
read, and metrics are a pure function of text that was already extracted,
so nothing about storing them can go stale.

## Processing stages reflect real request boundaries, not simulated timing

The spec's suggested 7-stage processing UI (Uploading, Validating,
Extracting, OCR, Analyzing, Generating, Complete) doesn't map to 7 real
signals — the backend only exposes two request boundaries (`POST
/documents` does upload+validate+extract+OCR in one call; `POST
/documents/{id}/analyze` does analyze+generate in another). Rather than
fabricate a timed animation pretending to track sub-steps we can't
observe, `ProcessingStages` groups the spec's labels under whichever real
request is in flight — steps 1-4 all show "active" together during the
upload call, 5-6 during the analyze call. Honest about what's actually
known, still delivers the requested step-by-step feel.

## Phase 5's "success" state is a minimal summary, not the dashboard

After a successful analysis, `/analyze` shows overall score, tone/
sentiment, and top strengths — not the full score-breakdown grid, charts,
or original-vs-improved comparison. That's explicitly Phase 6's scope
("Results dashboard" is its own phase in the spec's plan); building it
now would mean redoing it once Phase 6's actual design work happens.
Phase 5's job was proving the upload → extract → analyze flow works
end-to-end against the real API with real error handling, which it does.

## Landing page's dashboard preview is schematic, not fabricated data

The spec asks the landing page to "include a visual preview of the
analysis dashboard." `DashboardPreview` shows dimension labels (Hook,
Clarity, ...) with generic bar-length proportions and a literal `--/100`
placeholder — never a specific fake score like "82/100." The instruction
to not build fake analysis results is about the actual product flow, not
a marketing graphic, but the preview still deliberately avoids anything
that could be mistaken for a real result.

## History/Insights are real routes with an honest empty state, not 404s

The header nav (spec section 20) lists Analyze/History/Insights. Since
those pages' real content is Phase 7, clicking them now shows a clean
"coming soon" state rather than a broken link — the nav is genuinely
complete even though two of the three destinations are placeholders.

## No frontend component calls `fetch` directly

Every backend call goes through `lib/api.ts`, which throws a typed
`ApiError` (carrying the backend's `error_code`) rather than a generic
`Error`. `lib/error-messages.ts` maps every backend error code (from
`app/core/exceptions.py`) to a human-readable string, so a raw
`error_code` or stack trace is never shown to the user — the same
principle as the backend's own exception handling, mirrored on the
client.

## `nativeButton={false}` wherever Button renders as a Link

This project's shadcn setup uses Base UI (`@base-ui/react`), not Radix —
composition uses a `render` prop instead of `asChild`, and Base UI's
`Button` defaults to `nativeButton: true` (it expects the element it
renders as to be a real `<button>`). Every `<Button render={<Link .../>}>`
needs `nativeButton={false}` or Base UI logs an accessibility warning
about the rendered element not actually being a button. Caught via the
browser console during manual verification, not by the type checker.

## Only content_analysis.txt exists; content_improvement.txt is deferred

Spec section 16 names two prompt files. Only `content_analysis.txt` is
wired into any code path — the core analyze flow returns everything in
one structured response, including `improved_content`, matching section
15's example exactly. `content_improvement.txt` would back the *optional*
tone/length regeneration controls from section 17, which that same
section explicitly says "can be implemented after the core analysis
works" and "should not block the basic workflow." Creating an unused
prompt file now would be dead code with nothing to call it — it gets
added when the tone/length feature (and the frontend controls for it) is
actually built.

## `response_schema` set, but the response is still independently validated

`GeminiProvider` passes `AiAnalysisResult` as `config.response_schema`
(google-genai supports structured output directly from a Pydantic model),
which makes a well-formed response far more likely. But the raw text is
still `json.loads`'d and `AiAnalysisResult.model_validate`'d by hand
afterward rather than trusting the SDK's `response.parsed` — an empty
response (e.g. content blocked by a safety filter), a network hiccup
mid-stream, or a future SDK behavior change should never be able to skip
validation and crash the request. Belt and suspenders, not either/or.

## Hybrid scoring: which scores blend, and which don't

Spec section 13 gives the `overall_score` formula (40% deterministic /
60% AI) explicitly but leaves the other five scores unspecified beyond
"the exact formula can be adjusted." The per-score split implemented
(see README section 7 for the table) follows what's actually measurable
deterministically: `readability_score` is 100% deterministic because
section 12 lists "approximate readability" under deterministic metrics
and it is *not* in the AI's evaluation list; `hook_score`/`clarity_score`/
`engagement_score` are 100% AI because there's no honest deterministic
proxy for them (guessing at one would be worse than not pretending to
have one); `cta_score` blends 30/70 because deterministic metrics can
only detect a CTA *phrase's presence*, not whether it's actually
persuasive — that judgment call belongs to the AI. All of this is a
starting point, not a validated model — documented as a known limitation
rather than presented as more rigorous than it is.

## AI's own readability_score is requested but discarded

The prompt still asks for `readability_score` in the JSON response (the
spec's example includes it, and keeping the schema literal makes the
contract easier to reason about), but `ScoringService.blend_scores`
ignores it entirely in favor of the deterministic Flesch-based value —
see "Hybrid scoring" above for why.

## Missing GEMINI_API_KEY fails fast, but only inside `analyze_document`

`GeminiProvider.__init__` raises `AiAnalysisFailedError` immediately if
`api_key` is empty — no point letting a doomed request reach the network.
But `AnalysisService` only constructs `GeminiProvider` lazily, inside
`analyze_document()`, not in `__init__`. `AnalysisService(db)` is also
used for pure reads (`get`, `list` — e.g. `GET /analyses`), and those must
keep working with no `GEMINI_API_KEY` configured at all; failing at
`AnalysisService.__init__` would have broken every read endpoint over a
key those endpoints never needed.

## Analysis failure reverts document status, doesn't introduce a new one

If the AI call fails or its response is invalid, the document's `status`
reverts to `processed` (not a new `analysis_failed` value) and no
`analyses` row is created. Extraction already succeeded — that work
shouldn't be discarded by a separate, retryable failure. `ANALYZING` is
set transiently before the call and either becomes `ANALYZED` on success
or reverts on any exception, so a document can never get stuck at
`ANALYZING` from a single synchronous request.

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
