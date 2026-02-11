from __future__ import annotations

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool


def normalize_database_url(url: str) -> str:
    # Ensure psycopg driver and handle Heroku postgres:// URLs.
    if url.startswith("postgres://"):
        rest = url.removeprefix("postgres://")
        return "postgresql+psycopg://" + rest
    if url.startswith("postgresql://"):
        rest = url.removeprefix("postgresql://")
        return "postgresql+psycopg://" + rest
    return url


def make_engine(database_url: str) -> Engine:
    url = normalize_database_url(database_url)
    if url.startswith("sqlite"):
        # Keep in-memory SQLite stable across sessions/tests.
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    return create_engine(url, pool_pre_ping=True)


def make_sessionmaker(engine: Engine) -> sessionmaker[Session]:
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)
