from app.providers.llm.base import AiAnalysisResult
from app.services.scoring_service import blend_scores, compute_metrics

SAMPLE_POST = (
    "Just launched our biggest product update yet! We listened to your "
    "feedback and built exactly what you asked for.\n\n"
    "What do you think? Check it out and let us know! "
    "#ProductLaunch #Excited @teammate https://example.com/launch 🚀"
)


def _ai_result(**overrides) -> AiAnalysisResult:
    fields = {
        "overall_score": 80,
        "hook_score": 85,
        "clarity_score": 90,
        "engagement_score": 75,
        "cta_score": 60,
        "readability_score": 95,  # AI's own guess — should be ignored in favor of deterministic
        "tone": "professional",
        "sentiment": "positive",
        "target_audience": "marketers",
        "strengths": ["clear message"],
        "weaknesses": ["could be shorter"],
        "recommendations": ["trim the middle paragraph"],
        "improved_content": "An improved version.",
    }
    fields.update(overrides)
    return AiAnalysisResult(**fields)


class TestComputeMetrics:
    def test_counts_words_and_characters(self):
        metrics = compute_metrics("one two three four five")
        assert metrics.word_count == 5
        assert metrics.char_count == len("one two three four five")

    def test_counts_hashtags_mentions_urls_and_emoji(self):
        metrics = compute_metrics(SAMPLE_POST)
        assert metrics.hashtag_count == 2
        assert metrics.mention_count == 1
        assert metrics.url_count == 1
        assert metrics.emoji_count == 1

    def test_counts_questions(self):
        metrics = compute_metrics("Is this good? What about this? Yes.")
        assert metrics.question_count == 2

    def test_detects_cta_phrase(self):
        assert compute_metrics("Check it out and let us know!").has_cta is True
        assert compute_metrics("Sign up today for early access.").has_cta is True

    def test_no_cta_when_no_known_phrase_present(self):
        assert compute_metrics("Just sharing a quick thought today.").has_cta is False

    def test_counts_paragraphs_by_blank_line(self):
        metrics = compute_metrics("First paragraph.\n\nSecond paragraph.\n\nThird.")
        assert metrics.paragraph_count == 3

    def test_single_paragraph_when_no_blank_lines(self):
        metrics = compute_metrics("Just one paragraph with no breaks at all here.")
        assert metrics.paragraph_count == 1

    def test_empty_text_yields_zero_counts(self):
        metrics = compute_metrics("")
        assert metrics.word_count == 0
        assert metrics.sentence_count == 0
        assert metrics.paragraph_count == 0
        assert metrics.readability_score == 0

    def test_readability_score_is_clamped_between_0_and_100(self):
        simple = compute_metrics("I like cats. Cats are fun. I have a cat.")
        assert 0 <= simple.readability_score <= 100

    def test_simple_text_reads_easier_than_dense_text(self):
        simple = compute_metrics("I like cats. Cats are fun. Cats play a lot.")
        dense = compute_metrics(
            "Notwithstanding the aforementioned considerations, the "
            "organizational restructuring necessitates comprehensive "
            "stakeholder deliberation regarding implementation methodologies."
        )
        assert simple.readability_score > dense.readability_score

    def test_avg_sentence_length_computed_correctly(self):
        metrics = compute_metrics("One two three. Four five six.")
        assert metrics.sentence_count == 2
        assert metrics.avg_sentence_length == 3.0


class TestBlendScores:
    def test_readability_score_is_purely_deterministic(self):
        metrics = compute_metrics(SAMPLE_POST)
        ai = _ai_result(readability_score=1)  # AI's guess should be ignored entirely
        scores = blend_scores(metrics, ai)
        assert scores.readability_score == metrics.readability_score

    def test_hook_clarity_engagement_pass_through_from_ai_unchanged(self):
        metrics = compute_metrics(SAMPLE_POST)
        ai = _ai_result(hook_score=33, clarity_score=44, engagement_score=55)
        scores = blend_scores(metrics, ai)
        assert scores.hook_score == 33
        assert scores.clarity_score == 44
        assert scores.engagement_score == 55

    def test_cta_score_blends_deterministic_presence_with_ai_quality(self):
        metrics_with_cta = compute_metrics("Sign up today for early access.")
        metrics_without_cta = compute_metrics("Just sharing a quick thought today.")
        ai = _ai_result(cta_score=80)

        with_cta = blend_scores(metrics_with_cta, ai)
        without_cta = blend_scores(metrics_without_cta, ai)

        # Same AI cta_score, but presence of an actual CTA phrase should
        # push the blended score higher.
        assert with_cta.cta_score > without_cta.cta_score

    def test_overall_score_is_between_deterministic_and_ai_extremes(self):
        metrics = compute_metrics(SAMPLE_POST)
        low_ai = _ai_result(overall_score=0)
        high_ai = _ai_result(overall_score=100)

        low_scores = blend_scores(metrics, low_ai)
        high_scores = blend_scores(metrics, high_ai)

        assert low_scores.overall_score < high_scores.overall_score
        assert 0 <= low_scores.overall_score <= 100
        assert 0 <= high_scores.overall_score <= 100

    def test_all_scores_are_within_0_to_100(self):
        metrics = compute_metrics(SAMPLE_POST)
        ai = _ai_result()
        scores = blend_scores(metrics, ai)
        for value in (
            scores.overall_score,
            scores.hook_score,
            scores.clarity_score,
            scores.engagement_score,
            scores.cta_score,
            scores.readability_score,
        ):
            assert 0 <= value <= 100
