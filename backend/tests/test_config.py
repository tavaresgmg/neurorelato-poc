from __future__ import annotations

from app.core.config import Settings


def test_settings_normalizes_heroku_database_url_to_psycopg() -> None:
    s1 = Settings(database_url="postgres://user:pass@localhost:5432/db")
    assert s1.database_url.startswith("postgresql+psycopg://")

    s2 = Settings(database_url="postgresql://user:pass@localhost:5432/db")
    assert s2.database_url.startswith("postgresql+psycopg://")

    s3 = Settings(database_url="postgresql+psycopg://user:pass@localhost:5432/db")
    assert s3.database_url.startswith("postgresql+psycopg://")
