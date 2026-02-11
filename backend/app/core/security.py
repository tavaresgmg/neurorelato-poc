from __future__ import annotations

import secrets
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import Request
from starlette.responses import Response


def _unauthorized() -> Response:
    return Response(status_code=401, headers={"WWW-Authenticate": 'Basic realm="Demo"'})


class BasicAuthMiddleware:
    def __init__(
        self,
        app: Any,
        *,
        username: str,
        password: str,
        exempt_paths: set[str] | None = None,
    ):
        self.app = app
        self.username = username
        self.password = password
        self.exempt_paths = exempt_paths or set()

    async def __call__(
        self,
        scope: dict[str, Any],
        receive: Callable[[], Awaitable[Any]],
        send: Callable[[Any], Awaitable[None]],
    ) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        request = Request(scope)
        if request.url.path in self.exempt_paths:
            await self.app(scope, receive, send)
            return

        auth = request.headers.get("authorization")
        if not auth or not auth.lower().startswith("basic "):
            await _unauthorized()(scope, receive, send)
            return

        import base64

        try:
            decoded = base64.b64decode(auth.split(" ", 1)[1]).decode("utf-8")
            user, pw = decoded.split(":", 1)
        except Exception:
            await _unauthorized()(scope, receive, send)
            return

        ok_user = secrets.compare_digest(user, self.username)
        ok_pw = secrets.compare_digest(pw, self.password)
        if not (ok_user and ok_pw):
            await _unauthorized()(scope, receive, send)
            return

        await self.app(scope, receive, send)
