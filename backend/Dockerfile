# =============================================================================
# SmartCityAI — Production Backend & Online ML Inference Dockerfile
# Multi-stage, non-root, hardened minimal image
# =============================================================================

# --- Stage 1: Build & Dependency Wheel Cache ---
FROM python:3.11-slim-bookworm AS builder

WORKDIR /build

# Install build dependencies for C-extensions (LightGBM, XGBoost, psycopg2)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Compile wheels into wheelhouse to minimize final image size
RUN pip install --no-cache-dir --upgrade pip && \
    pip wheel --no-cache-dir --no-deps --wheel-dir /build/wheels -r requirements.txt


# --- Stage 2: Final Minimal Runtime Image ---
FROM python:3.11-slim-bookworm AS runner

# Metadata labels
LABEL maintainer="SmartCityAI Architecture Team"
LABEL version="1.0.0"
LABEL description="SmartCityAI FastAPI REST & Online Model Inference Core"

WORKDIR /app

# Install minimal runtime shared libraries (libpq for postgres, libgomp1 for OpenMP/LightGBM, curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Security: Create non-root system group and user
RUN groupadd -g 10001 -r smartcity && \
    useradd -u 10001 -r -g smartcity -s /usr/sbin/nologin -d /app appuser

# Install dependencies from builder wheels
COPY --from=builder /build/wheels /wheels
COPY --from=builder /build/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir /wheels/* && \
    rm -rf /wheels

# Copy application source code with non-root ownership
COPY --chown=appuser:smartcity backend/ /app/backend/
COPY --chown=appuser:smartcity ml/ /app/ml/
COPY --chown=appuser:smartcity schemas/ /app/schemas/
COPY --chown=appuser:smartcity features/ /app/features/
COPY --chown=appuser:smartcity validation/ /app/validation/
COPY --chown=appuser:smartcity pipelines/ /app/pipelines/

# Create logs directory with write permissions for appuser
RUN mkdir -p /app/logs && chown -R appuser:smartcity /app/logs

# Switch to unprivileged non-root user
USER appuser:smartcity

# Expose FastAPI listening port
EXPOSE 8000

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Docker Healthcheck instruction
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Start Uvicorn ASGI server with production worker settings
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers", "--forwarded-allow-ips", "*"]
