from app.utils.text_processing import is_meaningful_text, normalize_text


def test_normalize_collapses_repeated_spaces_and_tabs():
    assert normalize_text("hello    world\t\tfoo") == "hello world foo"


def test_normalize_converts_crlf_and_cr_to_lf():
    assert normalize_text("line one\r\nline two\rline three") == "line one\nline two\nline three"


def test_normalize_collapses_three_or_more_newlines_to_a_paragraph_break():
    assert normalize_text("para one\n\n\n\npara two") == "para one\n\npara two"


def test_normalize_preserves_single_and_double_newlines():
    assert normalize_text("line one\nline two\n\npara two") == "line one\nline two\n\npara two"


def test_normalize_strips_leading_and_trailing_whitespace():
    assert normalize_text("   \n  hello world  \n  ") == "hello world"


def test_normalize_removes_control_characters():
    assert normalize_text("hello\x00\x0bworld") == "helloworld"


def test_normalize_preserves_hashtags_mentions_urls_and_emoji():
    text = "Loving this launch! #GrowthMindset @teammate https://example.com/post 🚀🔥"
    assert normalize_text(text) == text


def test_meaningful_text_rejects_empty_string():
    assert is_meaningful_text("") is False


def test_meaningful_text_rejects_whitespace_only():
    assert is_meaningful_text("   \n\n   ") is False


def test_meaningful_text_rejects_text_shorter_than_minimum():
    assert is_meaningful_text("hi there") is False


def test_meaningful_text_rejects_symbol_noise_from_bad_ocr():
    assert is_meaningful_text("... --- ___ /// ...") is False


def test_meaningful_text_accepts_real_sentence():
    assert is_meaningful_text("This is a real social media post about our launch.") is True


def test_meaningful_text_accepts_hashtag_heavy_short_post():
    assert is_meaningful_text("Big news today #launch #excited #team") is True


def test_meaningful_text_respects_custom_min_chars():
    assert is_meaningful_text("short but ok", min_chars=5) is True
    assert is_meaningful_text("no", min_chars=5) is False
