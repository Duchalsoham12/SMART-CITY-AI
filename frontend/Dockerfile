# =============================================================================
# SmartCityAI — Production Frontend React SPA Dockerfile
# Multi-stage, non-root unprivileged Nginx Alpine image
# =============================================================================

# --- Stage 1: Node.js Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* ./

# Clean install dependencies
RUN npm ci || npm install --legacy-peer-deps

# Copy frontend source code
COPY . .

# Compile TypeScript and bundle Vite production assets
RUN npm run build


# --- Stage 2: Hardened Unprivileged Nginx Runner ---
FROM nginxinc/nginx-unprivileged:alpine AS runner

LABEL maintainer="SmartCityAI Architecture Team"
LABEL version="1.0.0"
LABEL description="SmartCityAI React Enterprise Dashboard Static Server"

# Copy custom hardened Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy compiled SPA static artifacts from builder stage
COPY --from=builder --chown=101:101 /app/dist /usr/share/nginx/html

# Expose unprivileged non-root port
EXPOSE 8080

# Healthcheck probe against lightweight endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O - http://localhost:8080/healthz || exit 1

# Start Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
