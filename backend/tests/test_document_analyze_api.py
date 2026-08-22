"""API-level tests for POST /documents/{id}/analyze.

`client` (via conftest's `mock_llm`) stubs AnalysisService's default LLM
provider, so these test the orchestration (status transitions, error
handling, platform passthrough) without needing GEMINI_API_KEY or network
access.
"""

from app.core.exceptions import AiAnalysisFailedError, InvalidAiResponseError
from tests.conftest import DEFAULT_AI_RESULT, FakeLLMProvider


def _upload(client, pdf_bytes) -> str:
    response = client.post(
        "/api/v1/documents",
        files={"file": ("post.pdf", pdf_bytes, "application/pdf")},
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_analyze_returns_blended_scores_and_ai_fields(client, pdf_bytes):
    document_id = _upload(client, pdf_bytes)

    response = client.post(f"/api/v1/documents/{document_id}/analyze")

    assert response.status_code == 201
    body = response.json()
    assert body["document_id"] == document_id
    assert 0 <= body["overall_score"] <= 100
    assert body["tone"] == DEFAULT_AI_RESULT.tone
    assert body["sentiment"] == DEFAULT_AI_RESULT.sentiment
    assert body["strengths"] == DEFAULT_AI_RESULT.strengths
    assert body["improved_content"] == DEFAULT_AI_RESULT.improved_content
    # readability is deterministic, not the AI's own guess
    assert body["readability_score"] != DEFAULT_AI_RESULT.readability_score

    metrics = body["metrics"]
    assert metrics["word_count"] > 0
    assert metrics["hashtag_count"] == 1  # "#ProductLaunch" in the pdf_bytes fixture
    assert metrics["readability_score"] == body["readability_score"]


def test_analyze_marks_document_analyzed(client, pdf_bytes):
    document_id = _upload(client, pdf_bytes)
    client.post(f"/api/v1/documents/{document_id}/analyze")

    document = client.get(f"/api/v1/documents/{document_id}").json()
    assert document["status"] == "analyzed"


def test_analyze_passes_platform_through_to_the_provider(client, pdf_bytes, mock_llm):
    document_id = _upload(client, pdf_bytes)

    response = client.post(f"/api/v1/documents/{document_id}/analyze?platform=linkedin")

    assert response.status_code == 201
    assert mock_llm.calls[-1][1] == "linkedin"


def test_analyze_defaults_to_generic_platform(client, pdf_bytes, mock_llm):
    document_id = _upload(client, pdf_bytes)
    client.post(f"/api/v1/documents/{document_id}/analyze")
    assert mock_llm.calls[-1][1] == "generic"


def test_analyze_rejects_invalid_platform(client, pdf_bytes):
    document_id = _upload(client, pdf_bytes)
    response = client.post(f"/api/v1/documents/{document_id}/analyze?platform=myspace")
    assert response.status_code == 422


def test_analyze_nonexistent_document_returns_404(client):
    response = client.post("/api/v1/documents/does-not-exist/analyze")
    assert response.status_code == 404
    assert response.json()["error_code"] == "NOT_FOUND"


def test_analyze_document_that_failed_extraction_returns_no_text_found(client):
    corrupted = client.post(
        "/api/v1/documents",
        files={"file": ("broken.pdf", b"%PDF-1.4\nnot a real pdf structure", "application/pdf")},
    )
    assert corrupted.status_code == 422

    document_id = client.get("/api/v1/documents").json()[0]["id"]
    response = client.post(f"/api/v1/documents/{document_id}/analyze")

    assert response.status_code == 422
    assert response.json()["error_code"] == "NO_TEXT_FOUND"


def test_ai_request_failure_returns_502_and_reverts_document_status(client, pdf_bytes, monkeypatch):
    from app.services.analysis_service import AnalysisService

    failing = FakeLLMProvider(error=AiAnalysisFailedError("Gemini request failed: timeout"))
    monkeypatch.setattr(AnalysisService, "_default_provider", staticmethod(lambda: failing))

    document_id = _upload(client, pdf_bytes)
    response = client.post(f"/api/v1/documents/{document_id}/analyze")

    assert response.status_code == 502
    assert response.json()["error_code"] == "AI_ANALYSIS_FAILED"

    document = client.get(f"/api/v1/documents/{document_id}").json()
    assert document["status"] == "processed"  # reverted, not stuck at "analyzing"


def test_invalid_ai_response_returns_502(client, pdf_bytes, monkeypatch):
    from app.services.analysis_service import AnalysisService

    failing = FakeLLMProvider(error=InvalidAiResponseError("Gemini response failed validation"))
    monkeypatch.setattr(AnalysisService, "_default_provider", staticmethod(lambda: failing))

    document_id = _upload(client, pdf_bytes)
    response = client.post(f"/api/v1/documents/{document_id}/analyze")

    assert response.status_code == 502
    assert response.json()["error_code"] == "INVALID_AI_RESPONSE"


def test_no_analysis_row_created_when_ai_call_fails(client, pdf_bytes, monkeypatch):
    from app.services.analysis_service import AnalysisService

    failing = FakeLLMProvider(error=AiAnalysisFailedError("boom"))
    monkeypatch.setattr(AnalysisService, "_default_provider", staticmethod(lambda: failing))

    document_id = _upload(client, pdf_bytes)
    client.post(f"/api/v1/documents/{document_id}/analyze")

    assert client.get("/api/v1/analyses").json() == []


def test_analysis_is_retrievable_after_success(client, pdf_bytes):
    document_id = _upload(client, pdf_bytes)
    created = client.post(f"/api/v1/documents/{document_id}/analyze").json()

    fetched = client.get(f"/api/v1/analyses/{created['id']}").json()
    assert fetched == created

    listed = client.get("/api/v1/analyses").json()
    assert len(listed) == 1
    assert listed[0]["id"] == created["id"]


class TestGetDocumentAnalysis:
    """GET /documents/{id}/analysis — lets the results page fetch an
    analysis knowing only the document id (e.g. from the URL)."""

    def test_returns_the_analysis_for_that_document(self, client, pdf_bytes):
        document_id = _upload(client, pdf_bytes)
        created = client.post(f"/api/v1/documents/{document_id}/analyze").json()

        response = client.get(f"/api/v1/documents/{document_id}/analysis")

        assert response.status_code == 200
        assert response.json() == created

    def test_404s_when_document_does_not_exist(self, client):
        response = client.get("/api/v1/documents/does-not-exist/analysis")
        assert response.status_code == 404
        assert response.json()["error_code"] == "NOT_FOUND"

    def test_404s_when_document_exists_but_has_not_been_analyzed(self, client, pdf_bytes):
        document_id = _upload(client, pdf_bytes)

        response = client.get(f"/api/v1/documents/{document_id}/analysis")

        assert response.status_code == 404
        assert response.json()["error_code"] == "NOT_FOUND"

    def test_returns_the_most_recent_analysis_when_reanalyzed(self, client, pdf_bytes):
        document_id = _upload(client, pdf_bytes)
        client.post(f"/api/v1/documents/{document_id}/analyze?platform=generic")
        second = client.post(f"/api/v1/documents/{document_id}/analyze?platform=linkedin").json()

        response = client.get(f"/api/v1/documents/{document_id}/analysis")

        assert response.status_code == 200
        assert response.json()["id"] == second["id"]
