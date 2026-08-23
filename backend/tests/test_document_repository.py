from app.models.document import DocumentStatus, ExtractionMethod
from app.repositories.document_repository import DocumentRepository


def _create(repo, filename="post.pdf"):
    return repo.create(filename=filename, original_file_type="application/pdf", file_size=100)


def test_create_sets_uploaded_status(db_session_factory):
    repo = DocumentRepository(db_session_factory())
    document = _create(repo)

    assert document.status == DocumentStatus.UPLOADED
    assert document.filename == "post.pdf"
    assert document.id  # a UUID was assigned


def test_get_returns_none_for_unknown_id(db_session_factory):
    repo = DocumentRepository(db_session_factory())
    assert repo.get("does-not-exist") is None


def test_get_returns_the_created_document(db_session_factory):
    repo = DocumentRepository(db_session_factory())
    created = _create(repo)

    fetched = repo.get(created.id)

    assert fetched is not None
    assert fetched.id == created.id


def test_list_orders_newest_first(db_session_factory):
    repo = DocumentRepository(db_session_factory())
    first = _create(repo, filename="a.pdf")
    second = _create(repo, filename="b.pdf")

    results = repo.list()

    assert [d.id for d in results] == [second.id, first.id]


def test_list_respects_limit(db_session_factory):
    repo = DocumentRepository(db_session_factory())
    for i in range(3):
        _create(repo, filename=f"post-{i}.pdf")

    results = repo.list(limit=2)

    assert len(results) == 2


def test_list_respects_skip(db_session_factory):
    repo = DocumentRepository(db_session_factory())
    for i in range(3):
        _create(repo, filename=f"post-{i}.pdf")

    all_results = repo.list()
    skipped = repo.list(skip=1)

    assert skipped == all_results[1:]


def test_list_empty_when_no_documents(db_session_factory):
    repo = DocumentRepository(db_session_factory())
    assert repo.list() == []


def test_update_status_sets_status_and_error_message(db_session_factory):
    repo = DocumentRepository(db_session_factory())
    document = _create(repo)

    updated = repo.update_status(
        document, status=DocumentStatus.FAILED, error_message="No readable text found."
    )

    assert updated.status == DocumentStatus.FAILED
    assert updated.error_message == "No readable text found."


def test_update_status_clears_error_message_when_not_provided(db_session_factory):
    repo = DocumentRepository(db_session_factory())
    document = _create(repo)
    repo.update_status(document, status=DocumentStatus.FAILED, error_message="Some error")

    cleared = repo.update_status(document, status=DocumentStatus.PROCESSED)

    assert cleared.error_message is None


def test_update_extraction_sets_text_method_and_status(db_session_factory):
    repo = DocumentRepository(db_session_factory())
    document = _create(repo)

    updated = repo.update_extraction(
        document,
        extracted_text="Hello world",
        extraction_method=ExtractionMethod.NATIVE,
        ocr_confidence=None,
    )

    assert updated.extracted_text == "Hello world"
    assert updated.extraction_method == ExtractionMethod.NATIVE
    assert updated.ocr_confidence is None
    assert updated.status == DocumentStatus.PROCESSED


def test_update_extraction_stores_ocr_confidence(db_session_factory):
    repo = DocumentRepository(db_session_factory())
    document = _create(repo)

    updated = repo.update_extraction(
        document,
        extracted_text="Recovered text",
        extraction_method=ExtractionMethod.OCR,
        ocr_confidence=87.5,
    )

    assert updated.extraction_method == ExtractionMethod.OCR
    assert updated.ocr_confidence == 87.5
