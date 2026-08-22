def test_list_analyses_empty_state(client):
    response = client.get("/api/v1/analyses")
    assert response.status_code == 200
    assert response.json() == []


def test_get_analysis_not_found_returns_404(client):
    response = client.get("/api/v1/analyses/does-not-exist")
    assert response.status_code == 404
    assert response.json()["error_code"] == "NOT_FOUND"
