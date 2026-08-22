from app.repositories.analysis_repository import AnalysisRepository
from app.repositories.document_repository import DocumentRepository
from app.services.insights_service import InsightsService, categorize_weakness


def _make_document(db):
    return DocumentRepository(db).create(
        filename="post.pdf", original_file_type="application/pdf", file_size=123
    )


def _analysis_fields(document_id: str, **overrides) -> dict:
    fields = {
        "document_id": document_id,
        "overall_score": 80,
        "hook_score": 70,
        "clarity_score": 84,
        "engagement_score": 81,
        "cta_score": 60,
        "readability_score": 85,
        "tone": "professional",
        "sentiment": "positive",
        "target_audience": "marketers",
        "strengths": ["Clear structure"],
        "weaknesses": [],
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
    fields.update(overrides)
    return fields


class TestCategorizeWeakness:
    def test_matches_cta_keyword(self):
        assert "Weak CTA" in categorize_weakness("The call to action is buried at the end.")

    def test_matches_hook_keyword(self):
        assert "Weak hook" in categorize_weakness("The opening line doesn't grab attention.")

    def test_matches_readability_keyword(self):
        assert "Poor readability" in categorize_weakness("Sentences are too long and wordy.")

    def test_matches_clarity_keyword(self):
        assert "Unclear messaging" in categorize_weakness("The message is confusing to follow.")

    def test_matches_engagement_keyword(self):
        text = "Feels generic and doesn't invite interaction."
        assert "Low engagement" in categorize_weakness(text)

    def test_no_match_returns_empty_list(self):
        assert categorize_weakness("Completely unrelated observation about grammar.") == []

    def test_can_match_multiple_categories(self):
        categories = categorize_weakness("Weak hook and buried call to action.")
        assert "Weak hook" in categories
        assert "Weak CTA" in categories

    def test_case_insensitive(self):
        assert "Weak CTA" in categorize_weakness("THE CALL TO ACTION IS UNCLEAR")


class TestInsightsServiceEmptyState:
    def test_returns_none_averages_and_empty_lists_with_no_analyses(self, db_session_factory):
        db = db_session_factory()
        summary = InsightsService(db).get_summary()

        assert summary.total_analyses == 0
        assert summary.average_overall_score is None
        assert summary.average_hook_score is None
        assert summary.average_cta_score is None
        assert summary.score_trend == []
        assert summary.common_weaknesses == []


class TestInsightsServiceWithData:
    def test_computes_correct_averages(self, db_session_factory):
        db = db_session_factory()
        analysis_repo = AnalysisRepository(db)

        for overall, hook, cta in [(80, 70, 60), (90, 80, 70), (70, 60, 50)]:
            document = _make_document(db)
            analysis_repo.create(
                **_analysis_fields(
                    document.id, overall_score=overall, hook_score=hook, cta_score=cta
                )
            )

        summary = InsightsService(db).get_summary()

        assert summary.total_analyses == 3
        assert summary.average_overall_score == 80.0
        assert summary.average_hook_score == 70.0
        assert summary.average_cta_score == 60.0

    def test_score_trend_is_chronological(self, db_session_factory):
        from datetime import datetime, timedelta

        db = db_session_factory()
        analysis_repo = AnalysisRepository(db)
        now = datetime.now()

        doc_a = _make_document(db)
        doc_b = _make_document(db)
        analysis_repo.create(
            **_analysis_fields(doc_a.id, overall_score=60), created_at=now - timedelta(hours=1)
        )
        analysis_repo.create(**_analysis_fields(doc_b.id, overall_score=90), created_at=now)

        summary = InsightsService(db).get_summary()

        assert [score for _, score in summary.score_trend] == [60, 90]

    def test_common_weaknesses_counted_and_sorted_by_frequency(self, db_session_factory):
        db = db_session_factory()
        analysis_repo = AnalysisRepository(db)

        weakness_sets = [
            ["The call to action is weak."],
            ["Call to action could be clearer."],
            ["The opening line doesn't hook the reader."],
        ]
        for weaknesses in weakness_sets:
            document = _make_document(db)
            analysis_repo.create(**_analysis_fields(document.id, weaknesses=weaknesses))

        summary = InsightsService(db).get_summary()

        assert summary.common_weaknesses[0] == ("Weak CTA", 2)
        assert ("Weak hook", 1) in summary.common_weaknesses

    def test_common_weaknesses_empty_when_no_weaknesses_match_a_category(self, db_session_factory):
        db = db_session_factory()
        document = _make_document(db)
        AnalysisRepository(db).create(
            **_analysis_fields(document.id, weaknesses=["Uses too many commas in one sentence."])
        )

        summary = InsightsService(db).get_summary()

        assert summary.common_weaknesses == []

    def test_top_weaknesses_limit_is_respected(self, db_session_factory):
        db = db_session_factory()
        analysis_repo = AnalysisRepository(db)

        for weakness in [
            "Weak call to action.",
            "Weak hook at the opening line.",
            "Confusing and unclear message.",
            "Feels generic, low engagement.",
            "Sentences are too wordy.",
        ]:
            document = _make_document(db)
            analysis_repo.create(**_analysis_fields(document.id, weaknesses=[weakness]))

        summary = InsightsService(db).get_summary(top_weaknesses=2)

        assert len(summary.common_weaknesses) == 2

    def test_trend_limit_keeps_most_recent_points(self, db_session_factory):
        from datetime import datetime, timedelta

        db = db_session_factory()
        analysis_repo = AnalysisRepository(db)
        now = datetime.now()

        for i in range(5):
            document = _make_document(db)
            analysis_repo.create(
                **_analysis_fields(document.id, overall_score=i),
                created_at=now - timedelta(minutes=5 - i),
            )

        summary = InsightsService(db).get_summary(trend_limit=2)

        assert [score for _, score in summary.score_trend] == [3, 4]
