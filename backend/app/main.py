from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api import analyses, documents, health, insights
from app.core.config import get_settings
from app.core.exceptions import AppError
from app.core.logging import configure_logging, get_logger

configure_logging()
logger = get_logger(__name__)
settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Extracts, analyzes, and improves social-media content from PDFs and images.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    # Narrowed to what the API actually exposes — GET/POST, and only the
    # Content-Type header the multipart upload needs — rather than a
    # blanket wildcard alongside allow_credentials=True.
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    logger.warning("app_error", extra={"error_code": exc.error_code, "path": request.url.path})
    return JSONResponse(
        status_code=exc.status_code,
        content={"error_code": exc.error_code, "message": exc.message},
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    # FastAPI's own {"detail": [...]} shape is genuinely more specific
    # than anything we'd invent (which field, why) — reshape it into the
    # app's one error envelope instead of discarding it, so the frontend's
    # error_code -> message mapping never has to special-case a second
    # response shape (see docs/decisions.md).
    logger.warning("validation_error", extra={"path": request.url.path})
    errors = exc.errors()
    message = errors[0]["msg"] if errors else "Invalid request."
    return JSONResponse(
        status_code=422,
        content={"error_code": "VALIDATION_ERROR", "message": message},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    # Covers framework-raised HTTP errors that never reach an AppError —
    # an unmatched route (404), a disallowed method (405), etc. Same
    # reasoning as validation_error_handler above.
    logger.warning(
        "http_exception", extra={"path": request.url.path, "status_code": exc.status_code}
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error_code": "HTTP_ERROR", "message": str(exc.detail)},
    )


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("unhandled_error", extra={"path": request.url.path})
    return JSONResponse(
        status_code=500,
        content={"error_code": "UNKNOWN_ERROR", "message": "An unexpected error occurred."},
    )


app.include_router(health.router, prefix=settings.api_v1_prefix)
app.include_router(documents.router, prefix=settings.api_v1_prefix)
app.include_router(analyses.router, prefix=settings.api_v1_prefix)
app.include_router(insights.router, prefix=settings.api_v1_prefix)


@app.get("/")
def root() -> dict[str, str]:
    return {"name": settings.app_name, "docs": "/docs"}
