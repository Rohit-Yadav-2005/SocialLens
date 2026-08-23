"""Verifies the global exception handlers in main.py: a genuinely
unhandled exception must never leak internals (message, type, traceback)
to the client — only a generic UNKNOWN_ERROR envelope.
"""

from fastapi.testclient import TestClient

from app.core.database import get_db
from app.main import app
from app.services.document_service import DocumentService


def test_unhandled_exception_returns_generic_500_without_leaking_details(
    db_session_factory, monkeypatch
):
    def raise_unexpected(self, document_id):
        raise RuntimeError("a secret internal detail that must not reach the client")

    monkeypatch.setattr(DocumentService, "get", raise_unexpected)

    def override_get_db():
        db = db_session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    try:
        client = TestClient(app, raise_server_exceptions=False)
        response = client.get("/api/v1/documents/some-id")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 500
    body = response.json()
    assert body == {"error_code": "UNKNOWN_ERROR", "message": "An unexpected error occurred."}
    assert "secret internal detail" not in response.text
    assert "RuntimeError" not in response.text
    assert "Traceback" not in response.text
