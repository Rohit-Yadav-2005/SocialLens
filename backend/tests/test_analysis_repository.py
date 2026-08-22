from datetime import datetime, timedelta

from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.document_repository import DocumentRepository


def _make_document(db):
    return DocumentRepository(db).create(
        filename="post.pdf", original_file_type="application/pdf", file_size=123
    )


def _analysis_fields(document_id: str) -> dict:
    return {
        "document_id": document_id,
        "overall_score": 82,
        "hook_score": 90,
        "clarity_score": 84,
        "engagement_score": 81,
        "cta_score": 73,
        "readability_score": 85,
        "tone": "professional",
        "sentiment": "positive",
        "target_audience": "B2B marketers",
        "strengths": ["Clear structure"],
        "weaknesses": ["Weak call to action"],
        "recommendations": ["Add a direct CTA"],
        "improved_content": "Improved post text.",
        "metrics": {
            "word_count": 42,
            "char_count": 250,
            "sentence_count": 4,
            "avg_sentence_length": 10.5,
            "hashtag_count": 2,
            "mention_count": 1,
            "url_count": 0,
            "emoji_count": 1,
            "question_count": 1,
            "has_cta": True,
            "paragraph_count": 2,
            "readability_score": 85,
        },
    }


def test_create_and_get_analysis(db_session_factory):
    db = db_session_factory()
    document = _make_document(db)
    repo = AnalysisRepository(db)

    created = repo.create(**_analysis_fields(document.id))

    fetched = repo.get(created.id)
    assert fetched is not None
    assert fetched.document_id == document.id
    assert fetched.overall_score == 82
    assert fetched.strengths == ["Clear structure"]


def test_get_by_document_id(db_session_factory):
    db = db_session_factory()
    document = _make_document(db)
    repo = AnalysisRepository(db)
    repo.create(**_analysis_fields(document.id))

    found = repo.get_by_document_id(document.id)
    assert found is not None
    assert found.document_id == document.id


def test_get_by_document_id_returns_most_recent_when_reanalyzed(db_session_factory):
    db = db_session_factory()
    document = _make_document(db)
    repo = AnalysisRepository(db)
    now = datetime.now()
    repo.create(**_analysis_fields(document.id), created_at=now - timedelta(minutes=5))
    newest = repo.create(**_analysis_fields(document.id), created_at=now)

    found = repo.get_by_document_id(document.id)

    assert found is not None
    assert found.id == newest.id


def test_list_orders_newest_first(db_session_factory):
    db = db_session_factory()
    doc_a = _make_document(db)
    doc_b = _make_document(db)
    repo = AnalysisRepository(db)
    now = datetime.now()
    # Explicit timestamps: SQLite's CURRENT_TIMESTAMP only has second
    # resolution, so two rapid inserts could otherwise tie.
    first = repo.create(**_analysis_fields(doc_a.id), created_at=now - timedelta(minutes=1))
    second = repo.create(**_analysis_fields(doc_b.id), created_at=now)

    results = repo.list()

    assert [a.id for a in results] == [second.id, first.id]
