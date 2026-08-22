# Architecture

SocialLens is a clean **modular monolith**: one Next.js frontend, one FastAPI
backend, one SQLite database. No microservices, no message queues, no
container orchestration — those would add operational complexity a
single-developer assessment project doesn't need.

## System overview

```mermaid
flowchart LR
    subgraph Client["Browser"]
        UI["Next.js App Router UI"]
    end

    subgraph Backend["FastAPI backend (modular monolith)"]
        API["/api/v1 routes"]
        SVC["Service layer\n(document, extraction, ocr, analysis, scoring)"]
        REPO["Repository layer"]
        PROV["Provider abstractions\n(OCR, LLM)"]
        DB[(SQLite)]
        TMP[["backend/temp/\n(uploaded files, deleted after processing)"]]
    end

    Tesseract["Tesseract OCR\n(local binary)"]
    Gemini["Gemini API"]

    UI -- "REST / JSON" --> API
    API --> SVC
    SVC --> REPO
    REPO --> DB
    SVC --> PROV
    PROV -- "OCR provider" --> Tesseract
    PROV -- "LLM provider" --> Gemini
    SVC -. "write, then delete" .-> TMP
```

## Request flow: upload → analysis

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Next.js
    participant API as FastAPI /documents
    participant EX as ExtractionService
    participant OCR as OCR Provider (Tesseract)
    participant AN as AnalysisService
    participant LLM as LLM Provider (Gemini)
    participant DB as SQLite

    U->>FE: Drop PDF/image
    FE->>API: POST /api/v1/documents (multipart)
    API->>API: validate type, size, signature
    API->>DB: create document (status=uploaded)
    API->>EX: extract(file)
    EX->>EX: try native text extraction (PyMuPDF)
    alt little/no text found
        EX->>OCR: render pages/image → OCR
        OCR-->>EX: text + confidence
    end
    EX-->>API: raw + normalized text
    API->>DB: update document (extracted_text, status=extracted)
    API-->>FE: document id + status
    FE->>API: POST /api/v1/documents/{id}/analyze
    API->>AN: analyze(document)
    AN->>AN: compute deterministic metrics
    AN->>LLM: request structured JSON analysis
    LLM-->>AN: scores, strengths, weaknesses, recommendations, improved_content
    AN->>AN: validate response (Pydantic), blend scores
    AN->>DB: create analysis row
    AN-->>API: analysis result
    API-->>FE: analysis result
    FE-->>U: results dashboard
```

## Layering (backend)

- **api/** — FastAPI routers. Thin: parse request, call a service, return a
  schema. No business logic.
- **services/** — business logic (extraction strategy, OCR orchestration,
  scoring, analysis orchestration). This is where the interesting code lives.
- **repositories/** — SQLAlchemy queries, isolated from services so the ORM
  never leaks into business logic or routes.
- **providers/** — swappable integrations behind small interfaces
  (`OCRProvider`, `LLMProvider`). See [decisions.md](decisions.md) for the
  replacement strategy (Tesseract → cloud OCR, Gemini → another LLM).
- **schemas/** — Pydantic request/response models, separate from SQLAlchemy
  models in `models/`.
- **core/** — cross-cutting config, logging, exceptions.

## Why these choices

- **SQLite, not Postgres**: zero setup, file-based, sufficient for an
  assessment's data volume. Models avoid SQLite-only features so a future
  swap to Postgres is a connection-string change (see decisions.md).
- **No task queue**: extraction/OCR/analysis run synchronously inside the
  request. Processing a single document takes seconds, not minutes — a queue
  would add infrastructure without solving a real problem at this scale.
- **Provider abstractions without extra providers**: `OCRProvider` and
  `LLMProvider` are interfaces with exactly one implementation each
  (Tesseract, Gemini). This keeps the seam for future providers without
  building speculative code for providers that don't exist yet.
- **Temp files, not blob storage**: uploads live in `backend/temp/` only
  for the duration of processing, then are deleted. No S3 bucket needed for
  an app that doesn't retain original files.
