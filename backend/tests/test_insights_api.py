"""API-level tests for GET /api/v1/insights."""


def _upload_and_analyze(client, pdf_bytes) -> str:
    document = client.post(
        "/api/v1/documents",
        files={"file": ("post.pdf", pdf_bytes, "application/pdf")},
    ).json()
    return client.post(f"/api/v1/documents/{document['id']}/analyze").json()["id"]


def test_insights_empty_state_before_any_analyses(client):
    response = client.get("/api/v1/insights")

    assert response.status_code == 200
    body = response.json()
    assert body["total_analyses"] == 0
    assert body["average_overall_score"] is None
    assert body["average_hook_score"] is None
    assert body["average_cta_score"] is None
    assert body["score_trend"] == []
    assert body["common_weaknesses"] == []


def test_insights_reflects_real_analyses(client, pdf_bytes):
    _upload_and_analyze(client, pdf_bytes)

    response = client.get("/api/v1/insights")

    assert response.status_code == 200
    body = response.json()
    assert body["total_analyses"] == 1
    assert body["average_overall_score"] is not None
    assert len(body["score_trend"]) == 1
    assert body["score_trend"][0]["overall_score"] == body["average_overall_score"]
