"""Chave Resend por pedido: header X-Resend-API-Key ou RESEND_API_KEY no ambiente."""

import os
from contextvars import ContextVar
from typing import Callable, Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from config import config

class MissingResendApiKeyError(Exception):
    """Nenhuma chave disponível."""


def resolve_resend_api_key() -> str:
    env = (os.environ.get("RESEND_API_KEY") or "").strip()
    if env:
        return env
    cfg = (getattr(config, "RESEND_API_KEY", "") or "").strip()
    if cfg:
        return cfg
    raise MissingResendApiKeyError(
        "Configure a chave RESEND_API_KEY no servidor (arquivo .env)."
    )


class ResendApiKeyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path
        if path in ("/", "/health"):
            return await call_next(request)
        if path.startswith("/docs") or path.startswith("/redoc") or path == "/openapi.json":
            return await call_next(request)
        if path == "/settings/server-key-configured" and request.method == "GET":
            return await call_next(request)

        try:
            resolve_resend_api_key()
            return await call_next(request)
        except MissingResendApiKeyError as e:
            return JSONResponse(
                status_code=401,
                content={"detail": str(e), "code": "missing_resend_api_key"},
            )

