"""
SmartCityAI - Structured Logging Middleware
Injects correlation trace IDs and records structured JSON execution logs.
"""

import json
import logging
import time
import uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("smartcityai.api")


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """Logs every HTTP request/response as a structured JSON record with correlation IDs."""

    async def dispatch(self, request: Request, call_next) -> Response:
        trace_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:12]}"
        start_time = time.perf_counter()

        # Store trace_id in request state for downstream handlers
        request.state.trace_id = trace_id

        try:
            response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000

            # Attach audit headers
            response.headers["X-Request-ID"] = trace_id
            response.headers["X-Process-Time-Ms"] = f"{duration_ms:.2f}"

            log_entry = {
                "trace_id": trace_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": round(duration_ms, 2),
                "client_ip": request.client.host if request.client else "unknown",
            }
            logger.info(json.dumps(log_entry))
            return response

        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            log_entry = {
                "trace_id": trace_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": 500,
                "duration_ms": round(duration_ms, 2),
                "error": str(exc),
            }
            logger.error(json.dumps(log_entry))
            raise exc
