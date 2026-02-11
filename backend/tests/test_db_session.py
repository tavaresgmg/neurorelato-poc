from __future__ import annotations

from sqlalchemy.pool import StaticPool

from app.db.session import make_engine, normalize_database_url


def test_normalize_database_url_heroku_postgres() -> None:
    assert (
        normalize_database_url("postgres://u:p@h:5432/db") == "postgresql+psycopg://u:p@h:5432/db"
    )


def test_normalize_database_url_plain_postgresql() -> None:
    assert (
        normalize_database_url("postgresql://u:p@h:5432/db") == "postgresql+psycopg://u:p@h:5432/db"
    )


def test_make_engine_sqlite_uses_static_pool() -> None:
    engine = make_engine("sqlite+pysqlite:///:memory:")
    assert isinstance(engine.pool, StaticPool)
    engine.dispose()
