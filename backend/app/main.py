from __future__ import annotations

from collections.abc import AsyncIterator, Awaitable, Callable
from contextlib import asynccontextmanager
from pathlib import Path
from threading import Thread
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import FileResponse, JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import Response
from starlette.staticfiles import StaticFiles

from app.api.v1.routes import router as v1_router
from app.core.config import settings
from app.core.errors import ApiError
from app.core.logging import install_pii_redaction_filters
from app.core.security import BasicAuthMiddleware
from app.db.session import make_engine, make_sessionmaker


def create_app(*, database_url: str | None = None, init_db: bool = False) -> FastAPI:
    install_pii_redaction_filters()

    engine = make_engine(database_url or settings.database_url)
    SessionLocal = make_sessionmaker(engine)

    def _maybe_warmup_embeddings() -> None:
        """
        Evita que o primeiro request com embeddings sofra o custo de download/init.
        Rodamos em background e ignoramos falhas (PoC resiliente).
        """
        if not (settings.embeddings_warmup or settings.enable_embeddings_by_default):
            return

        def _warm() -> None:
            try:
                from app.nlp.embeddings import get_default_provider

                provider = get_default_provider()
                provider.embed(["warmup"])
            except Exception:
                # Warmup não deve derrubar a aplicação.
                return

        Thread(target=_warm, daemon=True, name="embeddings-warmup").start()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        yield
        engine.dispose()

    app = FastAPI(title="NeuroRelato (PoC)", version="0.1.0", lifespan=lifespan)
    _maybe_warmup_embeddings()

    @app.middleware("http")
    async def _request_id_middleware(
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        # Ajuda a debugar sem logar PII: propagamos um id por request.
        request_id = request.headers.get("X-Request-ID") or str(uuid4())
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

    @app.exception_handler(RequestValidationError)
    async def _validation_error_handler(
        request: Request,
        exc: RequestValidationError,  # noqa: ARG001
    ) -> JSONResponse:
        # LGPD: do not echo raw input back to the client. Pydantic errors often include an `input`
        # field with the original value (which may contain PII/narrativa clínica).
        safe_errors: list[dict[str, object]] = []
        for e in exc.errors():
            safe_errors.append(
                {
                    "loc": e.get("loc"),
                    "msg": e.get("msg"),
                    "type": e.get("type"),
                }
            )
        err = ApiError(
            code="INVALID_INPUT",
            message="Input invalido.",
            details={"validation_errors": jsonable_encoder(safe_errors)},
        )
        return JSONResponse(status_code=400, content=err.to_dict())

    @app.exception_handler(StarletteHTTPException)
    async def _http_error_handler(
        request: Request,
        exc: StarletteHTTPException,  # noqa: ARG001
    ) -> JSONResponse:
        code_by_status = {
            400: "INVALID_INPUT",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            409: "CONFLICT",
            429: "RATE_LIMITED",
        }
        err = ApiError(
            code=code_by_status.get(exc.status_code, "HTTP_ERROR"),
            message=str(exc.detail) if getattr(exc, "detail", None) else "Erro HTTP.",
            details={},
        )
        return JSONResponse(status_code=exc.status_code, content=err.to_dict())

    @app.exception_handler(Exception)
    async def _unhandled_error_handler(request: Request, exc: Exception) -> JSONResponse:  # noqa: ARG001
        # Avoid leaking sensitive data (including the clinical narrative).
        err = ApiError(code="INTERNAL_ERROR", message="Erro interno.", details={})
        return JSONResponse(status_code=500, content=err.to_dict())

    app.include_router(v1_router)
    app.state.engine = engine
    app.state.SessionLocal = SessionLocal

    if init_db:
        # Used only in tests/dev helpers. Production uses Alembic migrations.
        from app.db import models as _models  # noqa: F401
        from app.db.base import Base

        Base.metadata.create_all(bind=engine)

    static_dir = Path(__file__).resolve().parent / "static"
    if static_dir.exists():
        # Build: Vite SPA assets live here. Mounting after API keeps `/api/*` working.
        app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

        @app.get("/{path:path}", include_in_schema=False)
        def spa_fallback(path: str) -> FileResponse:  # noqa: ARG001
            return FileResponse(static_dir / "index.html")

    if settings.basic_auth_user and settings.basic_auth_password:
        app.add_middleware(
            BasicAuthMiddleware,
            username=settings.basic_auth_user,
            password=settings.basic_auth_password,
            exempt_paths={"/api/v1/health"},
        )

    return app


app = create_app()
