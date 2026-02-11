from __future__ import annotations

from collections.abc import Generator

from fastapi import Request
from sqlalchemy.orm import Session


def get_db(request: Request) -> Generator[Session]:
    SessionLocal = request.app.state.SessionLocal
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
