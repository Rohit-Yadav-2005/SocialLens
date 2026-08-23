from app.core.config import Settings


def test_cors_origins_list_splits_on_comma():
    settings = Settings(cors_origins="http://localhost:3000,http://localhost:3001")
    assert settings.cors_origins_list == ["http://localhost:3000", "http://localhost:3001"]


def test_cors_origins_list_strips_whitespace():
    settings = Settings(cors_origins=" http://localhost:3000 , http://localhost:3001 ")
    assert settings.cors_origins_list == ["http://localhost:3000", "http://localhost:3001"]


def test_cors_origins_list_drops_empty_entries_from_trailing_comma():
    settings = Settings(cors_origins="http://localhost:3000,")
    assert settings.cors_origins_list == ["http://localhost:3000"]


def test_cors_origins_list_single_origin():
    settings = Settings(cors_origins="http://localhost:3000")
    assert settings.cors_origins_list == ["http://localhost:3000"]


def test_max_upload_size_bytes_converts_mb_to_bytes():
    settings = Settings(max_upload_size_mb=20)
    assert settings.max_upload_size_bytes == 20 * 1024 * 1024
