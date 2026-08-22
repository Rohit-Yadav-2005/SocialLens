def test_upload_document_creates_record(client, pdf_bytes):
    response = client.post(
        "/api/v1/documents",
        files={"file": ("post.pdf", pdf_bytes, "application/pdf")},
    )
    assert response.status_code == 201
    body = response.json()
    assert body["filename"] == "post.pdf"
    assert body["status"] == "uploaded"
    assert body["file_size"] == len(pdf_bytes)
    assert body["extracted_text"] is None


def test_upload_writes_file_to_temp_dir(client, pdf_bytes, tmp_path):
    response = client.post(
        "/api/v1/documents",
        files={"file": ("post.pdf", pdf_bytes, "application/pdf")},
    )
    document_id = response.json()["id"]
    saved_files = list(tmp_path.glob(f"{document_id}*"))
    assert len(saved_files) == 1
    assert saved_files[0].read_bytes() == pdf_bytes


def test_upload_rejects_invalid_file_type(client):
    response = client.post(
        "/api/v1/documents",
        files={"file": ("virus.exe", b"MZ...", "application/x-msdownload")},
    )
    assert response.status_code == 400
    assert response.json()["error_code"] == "INVALID_FILE_TYPE"


def test_upload_rejects_oversized_file(client, monkeypatch):
    from app.core.config import get_settings

    monkeypatch.setattr(get_settings(), "max_upload_size_mb", 0)
    response = client.post(
        "/api/v1/documents",
        files={"file": ("post.pdf", b"%PDF-1.4\nsomething", "application/pdf")},
    )
    assert response.status_code == 400
    assert response.json()["error_code"] == "FILE_TOO_LARGE"


def test_get_document_by_id(client, pdf_bytes):
    created = client.post(
        "/api/v1/documents",
        files={"file": ("post.pdf", pdf_bytes, "application/pdf")},
    ).json()

    response = client.get(f"/api/v1/documents/{created['id']}")
    assert response.status_code == 200
    assert response.json()["id"] == created["id"]


def test_get_document_not_found_returns_404(client):
    response = client.get("/api/v1/documents/does-not-exist")
    assert response.status_code == 404
    assert response.json()["error_code"] == "NOT_FOUND"


def test_list_documents_returns_uploaded_documents(client, pdf_bytes, png_bytes):
    client.post("/api/v1/documents", files={"file": ("a.pdf", pdf_bytes, "application/pdf")})
    client.post("/api/v1/documents", files={"file": ("b.png", png_bytes, "image/png")})

    response = client.get("/api/v1/documents")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2
    assert {d["filename"] for d in body} == {"a.pdf", "b.png"}


def test_list_documents_empty_state(client):
    response = client.get("/api/v1/documents")
    assert response.status_code == 200
    assert response.json() == []
