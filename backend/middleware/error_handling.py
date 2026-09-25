"""
SmartCityAI - Global Exception Handlers
Provides centralized, consistent JSON error responses across the API.
"""

from datetime import datetime, timezone
import logging
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

logger = logging.getLogger("smartcityai.errors")


def register_exception_handlers(app: FastAPI) -> None:
    """Registers global exception handlers on the FastAPI application."""

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        trace_id = getattr(request.state, "trace_id", "unknown")
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error_code": f"HTTP_{exc.status_code}",
                "detail": exc.detail,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": request.url.path,
                "trace_id": trace_id,
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        trace_id = getattr(request.state, "trace_id", "unknown")
        errors = []
        for err in exc.errors():
            loc = " -> ".join([str(l) for l in err.get("loc", [])])
            msg = err.get("msg", "Validation error")
            errors.append(f"{loc}: {msg}")

        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error_code": "VALIDATION_ERROR",
                "detail": "; ".join(errors),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": request.url.path,
                "trace_id": trace_id,
                "field_errors": exc.errors(),
            },
        )

    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        trace_id = getattr(request.state, "trace_id", "unknown")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error_code": "BAD_REQUEST",
                "detail": str(exc),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": request.url.path,
                "trace_id": trace_id,
            },
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        trace_id = getattr(request.state, "trace_id", "unknown")
        logger.exception(f"Unhandled exception on {request.url.path} [trace: {trace_id}]")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error_code": "INTERNAL_SERVER_ERROR",
                "detail": "An unexpected internal server error occurred. Please contact the administrator.",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "path": request.url.path,
                "trace_id": trace_id,
            },
        )
