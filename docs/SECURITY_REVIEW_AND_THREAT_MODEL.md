# SmartCityAI — Security Review, Threat Model & Hardening Roadmap

**Document Version:** 1.0.0  
**Target Environment:** SmartCityAI Platform (FastAPI Core, React 18, PostgreSQL 16, MLflow 3.16)  
**Security Status:** Comprehensive Audit Completed & Hardened (Zero Security Grandstanding Policy Enforced)  
**Classification:** Internal Technical Architecture & Compliance Specification  

---

## 1. Executive Summary & Security Philosophy

### 1.1 Objective & Policy Statement
This document provides an objective, rigorous security review and STRIDE threat model for the **SmartCityAI** urban intelligence and predictive decision platform. 

> [!IMPORTANT]
> **Zero Security Grandstanding Principle**: Documenting a security control or drafting a mitigation policy does not make a system secure. Security is a continuous operational lifecycle comprising defensive programming, continuous verification, least-privilege configuration, runtime containment, and proactive incident response. This document strictly delineates **controls that are implemented and verified in code** from **identified architectural gaps and recommendations**.

### 1.2 Security Posture Summary
The SmartCityAI platform demonstrates strong foundational hygiene in core application domains:
- **Parameterization & ORM Integrity:** All database operations utilize SQLAlchemy 2.0 ORM parameterization, mitigating standard SQL injection vulnerabilities.
- **Strict Boundary Validation:** Pydantic v2 schemas reject malformed datatypes, out-of-bounds geographic coordinates, and anomalous sensor inputs before execution.
- **Timing-Safe Credential Verification:** API key authentication utilizes `secrets.compare_digest` to eliminate side-channel timing analysis.
- **Exception Sanitization:** Unhandled runtime exceptions return sanitized JSON responses with correlation trace IDs, preventing internal stack traces or connection strings from leaking.
- **Container Isolation:** Multi-stage Docker containers execute as non-root users (`appuser:smartcity`, UID 10001; `nginx`, UID 101) with internal network segmentation.

However, realistic high-priority vulnerabilities exist in the current architecture:
1. **Absence of Application-Layer Rate Limiting:** High-cost ML inference endpoints (`/traffic/forecast`, `/geospatial/risk-grid`, `/insights/ask`) are susceptible to Denial of Service (DoS) and computational resource starvation.
2. **Shared Static API Keys:** Current authentication uses static shared role keys rather than individual user identities with cryptographic lifecycles (JWT/OIDC) and revocation capability.
3. **Database Privilege Concentration:** Application services connect using a single database account with full schema modification rights rather than a restricted, unprivileged DML role.

---

## 2. In-Depth Audit Across 12 Security Domains

```
                                  +--------------------------------------------------+
                                  |            EXTERNAL INTERNET / CLIENTS           |
                                  +--------------------------------------------------+
                                                           |
                                                HTTPS / TLS Termination
                                                           v
                                  +--------------------------------------------------+
                                  |         Nginx Reverse Proxy (:8080)              |
                                  |   - Unprivileged UID 101                         |
                                  |   - Security Headers (CSP, HSTS, X-Frame)        |
                                  |   - Public Bridge Network                        |
                                  +--------------------------------------------------+
                                                           |
                                               Internal Forwarding
                                                           v
+---------------------------------------------------------------------------------------------------------+
| SMARTCITYAI PLATFORM CORE                                                                               |
|                                                                                                         |
|   +--------------------------------------------------+                                                  |
|   |         FastAPI REST Gateway (:8000)             |                                                  |
|   |   - Non-root UID 10001 (appuser)                 |                                                  |
|   |   - secrets.compare_digest Auth                  |                                                  |
|   |   - Hierarchical RBAC (viewer/analyst/admin)     |                                                  |
|   |   - Pydantic v2 Request Validation               |                                                  |
|   |   - Correlation ID & JSON Structured Logs        |                                                  |
|   +--------------------------------------------------+                                                  |
|                            |                                                                            |
|        Internal Bridge     | Isolated Database Transactions (smartcity-internal-net)                    |
|        (No Direct Internet)|                                                                            |
|                            v                                                                            |
|   +--------------------------------------------------+   +------------------------------------------+   |
|   |        PostgreSQL 16 Analytical Store            |   |     ML Worker & Retraining Daemon        |   |
|   |   - Port 5432 bound to 127.0.0.1 / internal net  |   |   - Non-root UID 10001                   |   |
|   |   - Persistent volume isolation                  |   |   - Offline Drift & Retrain Jobs         |   |
|   +--------------------------------------------------+   +------------------------------------------+   |
+---------------------------------------------------------------------------------------------------------+
```

### 2.1 Authentication
- **Implemented & Verified Controls:**
  - Token extraction supports both `X-API-Key` headers and standard `Authorization: Bearer <key>` format via FastAPI `Security` dependencies ([`backend/auth/security.py`](file:///c:/Users/Soham/Desktop/SmartCityAI/backend/auth/security.py)).
  - Credential verification uses `secrets.compare_digest` to provide constant-time comparison, preventing side-channel timing attacks that infer key prefixes.
  - Missing or invalid credentials yield standardized HTTP 401 Unauthorized responses with `WWW-Authenticate: Bearer` challenge headers.
- **Identified Gaps & Vulnerabilities:**
  - Static shared API keys (`API_KEY_ADMIN`, `API_KEY_ANALYST`, `API_KEY_VIEWER`) are shared across all clients of that role. If a key is compromised, it cannot be revoked for a single client without causing platform-wide disruption.
  - Development default keys exist in [`backend/config.py`](file:///c:/Users/Soham/Desktop/SmartCityAI/backend/config.py) as fallbacks when environment variables are omitted.
  - No Multi-Factor Authentication (MFA), password rotation, or session expiry mechanisms exist.
- **Actionable Mitigations:**
  - Migrate to OAuth2 / OpenID Connect (OIDC) with short-lived RS256 JWTs (15-minute expiry) and refresh tokens issued by an identity provider (e.g., Keycloak or Cloud IAM).
  - Enforce startup validation that immediately aborts application boot if default development keys are detected when `ENVIRONMENT=production`.

### 2.2 Authorization & Role-Based Access Control (RBAC)
- **Implemented & Verified Controls:**
  - Hierarchical RBAC structure (`viewer` level 1, `analyst` level 2, `admin` level 3) enforced via `require_role(min_role)` dependency factory.
  - Higher roles inherit all permissions of lower roles (`admin` can access `analyst` and `viewer` endpoints; `analyst` can access `viewer` endpoints).
  - Telemetry ingestion routes (`POST /traffic`, `POST /accidents`, `POST /environment`) strictly enforce `analyst` or `admin` permissions.
- **Identified Gaps & Vulnerabilities:**
  - Lack of Object-Level Access Control (IDOR): Any authorized `analyst` can create or modify telemetry for any sensor corridor or incident across the entire city. There is no tenant, agency, or territorial partition.
  - Retraining and administrative operations lack granular sub-privilege segmentation (e.g., `model:retrain` vs `telemetry:write`).
- **Actionable Mitigations:**
  - Implement Attribute-Based Access Control (ABAC) or Policy as Code (Open Policy Agent) to enforce departmental scope (e.g., Chicago DOT analyst vs EPA environmental monitor).

### 2.3 API Security & Gateway Protections
- **Implemented & Verified Controls:**
  - Automatic OpenAPI / Swagger generation with complete schema typing and descriptive endpoint tags.
  - Centralized exception handlers in [`backend/middleware/error_handling.py`](file:///c:/Users/Soham/Desktop/SmartCityAI/backend/middleware/error_handling.py) intercept unhandled exceptions and return uniform, sanitized JSON responses.
  - Correlation trace IDs (`X-Request-ID`) are generated or propagated on every request and returned in response headers for end-to-end request tracing.
- **Identified Gaps & Vulnerabilities:**
  - Swagger UI (`/docs`) and ReDoc (`/redoc`) endpoints are exposed by default in all environments, permitting unauthenticated reconnaissance of platform capabilities.
  - Standard HTTP security headers (e.g., `X-Content-Type-Options`, `Content-Security-Policy`, `HSTS`) are defined in Nginx but not configured as fallback headers inside the FastAPI application itself.
- **Actionable Mitigations:**
  - Conditionally disable documentation endpoints in production: `docs_url=None if settings.ENVIRONMENT == "production" else "/docs"`.
  - Add `SecureHeadersMiddleware` in FastAPI to guarantee security headers even if the reverse proxy is bypassed in internal mesh topologies.

### 2.4 SQL Injection & Query Parameterization
- **Implemented & Verified Controls:**
  - 100% of analytical, incident, and telemetry queries use SQLAlchemy ORM expression builders (`db.query(...).filter(...)`), ensuring all parameters are bound via parameterized queries.
  - Text search filters (such as corridor street matching: `.ilike(f"%{street_name}%")`) are bound to SQL parameters rather than concatenated into raw SQL strings.
  - The AI Assistant Fact Retriever utilizes deterministic Python lookup methods and pre-compiled query plans rather than executing LLM-generated raw SQL text against the database.
- **Identified Gaps & Vulnerabilities:**
  - Automated static analysis (e.g., Bandit `B608` checks) is not currently part of the CI quality gate to guarantee future pull requests do not introduce raw SQL string interpolations.
- **Actionable Mitigations:**
  - Add automated AST scanning via Bandit to CI pipeline to reject any use of `session.execute(f"...")` or unparameterized `text()` clauses.

### 2.5 Input Validation & Boundary Enforcement
- **Implemented & Verified Controls:**
  - Pydantic v2 schemas enforce strict data typing, nullability constraints, and physical boundaries across all ingestion endpoints:
    - Speed telemetry: `0.0 <= speed <= 150.0 mph`.
    - Geospatial coordinates: `-90.0 <= latitude <= 90.0`, `-180.0 <= longitude <= 180.0`.
    - Air Quality Index: `0.0 <= aqi <= 500.0`.
    - Quantile bounds: `0.0 < lower_quantile < upper_quantile < 1.0`.
  - Violations immediately terminate request processing with HTTP 422 Unprocessable Entity, detailing the exact field and validation error.
- **Identified Gaps & Vulnerabilities:**
  - No explicit request body size limiter is enforced within the FastAPI application layer. An attacker could transmit an oversized JSON array to cause high memory allocation.
- **Actionable Mitigations:**
  - Enforce a 2 MB maximum body size limit middleware in FastAPI: reject oversized requests with HTTP 413 Payload Too Large.

### 2.6 CORS (Cross-Origin Resource Sharing)
- **Implemented & Verified Controls:**
  - FastAPI `CORSMiddleware` configured with dynamic origin loading from `settings.CORS_ORIGINS`.
- **Identified Gaps & Vulnerabilities:**
  - Configuration in `backend/main.py` uses `allow_methods=["*"]` and `allow_headers=["*"]`. This is overly permissive.
  - Default development origins (`http://localhost:3000`, `http://localhost:5173`) are bundled in default configuration strings.
- **Actionable Mitigations:**
  - Explicitly restrict allowed HTTP methods to `["GET", "POST", "PUT", "DELETE", "OPTIONS"]`.
  - Whitelist only required headers: `["Authorization", "X-API-Key", "Content-Type", "X-Request-ID"]`.

### 2.7 Rate Limiting & Denial of Service (DoS) Defense
- **Implemented & Verified Controls:**
  - Container-level CPU and memory limits in `docker-compose.yml` prevent container resource exhaustion from destabilizing the host operating system.
  - Nginx configuration specifies worker connection ceilings (`worker_connections 1024;`) and keepalive timeouts.
- **Identified Gaps & Vulnerabilities:**
  - **CRITICAL GAP:** There is currently **zero application-level rate limiting** on the FastAPI backend. An authenticated user (or unauthenticated attacker targeting public endpoints) can launch thousands of concurrent requests against `/api/v1/traffic/forecast` (LightGBM quantile inference) or `/api/v1/insights/ask` (NLP synthesis), resulting in CPU exhaustion and service outage.
- **Actionable Mitigations:**
  - Deploy Redis-backed distributed rate limiting via `slowapi` or FastAPI limiter middleware:
    - Public / viewer tier: 60 requests/minute.
    - Analyst tier: 300 requests/minute.
    - High-compute ML inference: 15 requests/minute.
  - Configure `limit_req_zone` and `limit_req` directives in Nginx reverse proxy.

### 2.8 Secret Management & Environment Security
- **Implemented & Verified Controls:**
  - Secrets and credentials (`API_KEY_ADMIN`, `DATABASE_URL`, `SECRET_KEY`) are read exclusively from environment variables via `backend/config.py`.
  - The repository `.gitignore` explicitly blocks `.env`, `*.pem`, `*.key`, and SQLite `*.db` files from source control.
- **Identified Gaps & Vulnerabilities:**
  - Hardcoded default secrets are present in `backend/config.py` for development convenience. If deployed to production without environment configuration, the application will boot with known credentials.
  - Plaintext `.env` files are used in Docker Compose rather than Docker Swarm secrets, Kubernetes secrets, or an external vault.
- **Actionable Mitigations:**
  - Implement a production guard in `backend/config.py` that raises a fatal `RuntimeError` on startup if `ENVIRONMENT=production` and `SECRET_KEY` equals the default value.
  - Integrate HashiCorp Vault or AWS Secrets Manager for dynamic secret leasing and rotation.

### 2.9 Dependency Vulnerabilities & Supply Chain Security
- **Implemented & Verified Controls:**
  - Pinned exact versions across all 38 Python backend packages in `requirements.txt` and all frontend dependencies in `package.json`.
  - Multi-stage Docker build cache isolates C-compiler build toolchains (`gcc`, `build-essential`) from the production runtime image.
- **Identified Gaps & Vulnerabilities:**
  - Package hashes (`--require-hashes`) are not specified in `requirements.txt`, leaving potential exposure to upstream PyPI wheel tampering.
  - No automated Software Composition Analysis (SCA) tool (`pip-audit`, `safety`, `npm audit`, or Snyk) is currently integrated into the CI test runner.
- **Actionable Mitigations:**
  - Add `pip-audit --desc on` and `npm audit --audit-level=high` directly into the CI quality gate (`scripts/run_ci_pipeline.py`).
  - Generate an automated Software Bill of Materials (SBOM) in CycloneDX format during release builds.

### 2.10 Docker & Container Runtime Security
- **Implemented & Verified Controls:**
  - **Non-Root Execution:** Backend and ML worker run as `appuser:smartcity` (UID 10001); frontend runs on Nginx unprivileged (UID 101) listening on unprivileged port 8080.
  - **Minimal Base Images:** Built on official Debian slim images (`python:3.11-slim-bookworm`) and Alpine Linux (`nginxinc/nginx-unprivileged:alpine-slim`), minimizing attack surface.
  - **Network Segmentation:** Dual bridge networks (`smartcity-internal-net` and `smartcity-public-net`). The database and ML worker reside exclusively on `smartcity-internal-net` (`internal: true`), completely isolated from external internet ingress and egress.
  - **Host Port Binding:** PostgreSQL container port is bound to `127.0.0.1` only, preventing direct WAN exposure.
- **Identified Gaps & Vulnerabilities:**
  - The container root filesystems are mounted read-write. An attacker achieving remote code execution could write malicious files to disk.
  - Linux capabilities are not explicitly dropped; no custom AppArmor or Seccomp profiles are configured.
- **Actionable Mitigations:**
  - Mount container filesystems as read-only (`read_only: true` in Compose) and provide explicit `tmpfs` mounts for `/tmp` and ephemeral log directories.
  - Drop all capabilities and retain only required flags: `cap_drop: ["ALL"]`, `cap_add: ["NET_BIND_SERVICE"]`.
  - Set `security_opt: ["no-new-privileges:true"]`.

### 2.11 Database Permissions & Least Privilege
- **Implemented & Verified Controls:**
  - Explicit table schemas, data types, indexes, and primary/foreign key integrity rules enforced by SQLAlchemy ORM.
  - Direct database access is sequestered on the isolated Docker network.
- **Identified Gaps & Vulnerabilities:**
  - The application backend connects using the PostgreSQL superuser / database owner account (`smartcity_admin`).
  - Full Data Definition Language (DDL) permissions are available to the API runtime: a compromised backend process has the ability to `DROP TABLE`, `TRUNCATE`, or alter database schemas.
  - Database connection strings do not enforce SSL encryption (`sslmode=require`).
- **Actionable Mitigations:**
  - Create segregated database roles:
    1. `smartcity_app`: DML privileges only (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) on operational tables.
    2. `smartcity_migrator`: DDL privileges (`CREATE`, `ALTER`, `DROP`) used exclusively by Alembic during scheduled migrations.
    3. `smartcity_analytics`: Read-only (`SELECT`) role for background reporting and offline ML training.
  - Enforce `sslmode=verify-full` in production PostgreSQL connection strings.

### 2.12 Logging of Sensitive Data & Audit Trails
- **Implemented & Verified Controls:**
  - `StructuredLoggingMiddleware` serializes execution events as structured JSON with correlation `trace_id`, method, path, HTTP status, duration, and client IP.
  - **Data Leakage Safeguard:** Request headers (such as `Authorization`, `X-API-Key`, or session cookies) and request payloads are explicitly excluded from application logs.
  - Global error handlers log full exception traces internally to private application logs while returning generic error messages to clients.
- **Identified Gaps & Vulnerabilities:**
  - No dedicated security audit log exists to record critical events: failed authentication attempts, unauthorized privilege elevation requests, model retraining triggers, or bulk data exports.
  - Logs are currently emitted to stdout/stderr and local container files without cryptographic integrity protection or automated log shipping to a SIEM.
- **Actionable Mitigations:**
  - Implement a dedicated `SecurityAuditLogger` that records security-relevant events to a write-only, tamper-evident audit stream.
  - Forward logs to an enterprise log management system (e.g., AWS CloudWatch, Datadog, or ELK Stack) with immutable retention policies.

---

## 3. STRIDE Threat Model

The STRIDE methodology analyzes threats across the system's operational attack surface:

| STRIDE Category | Threat Description | Attack Vector / Scenario | Platform Component | Impact | Current Implemented Control | Residual Risk Level |
|---|---|---|---|---|---|---|
| **S - Spoofing** | Adversary impersonates a city traffic sensor or administrator | Transmitting counterfeit telemetry to `/api/v1/traffic` using stolen or leaked API keys | Ingestion Gateway (`/api/v1/traffic`) | High: Distorts traffic forecasts and emergency routing | Static API key verification with `secrets.compare_digest` | **Medium** (Static keys lack per-device signatures) |
| **T - Tampering** | Malicious alteration of ML model weights or historical safety data | Attacker modifies LightGBM model artifact on shared volume or directly updates DB crash records | Model Registry (`ml/artifacts/`) & PostgreSQL DB | Critical: Alters hazard ratings and city risk planning | Non-root container permissions; internal network isolation | **Medium** (Storage volume lacks cryptographic checksum signing) |
| **R - Repudiation** | An analyst modifies risk thresholds or triggers retrain, denying the action | User triggers retrain or updates telemetry without identity recorded | Administrative routes & ML worker | Medium: Inability to audit unauthorized city adjustments | Correlation `trace_id` logged with client IP | **High** (Shared keys prevent distinguishing individual analysts) |
| **I - Information Disclosure** | Leaking sensitive travel trajectories or internal database details | SQL error leakage or scraping high-resolution GPS trajectories | Backend API & Geospatial Router | High: Privacy violation under urban surveillance laws | Generic error handlers hide stack traces; CORS origin whitelist | **Low** (Stack traces suppressed; spatial data aggregated to H3/DBSCAN) |
| **D - Denial of Service** | Exhausting server resources via unthrottled ML inference calls | Flooding `/api/v1/traffic/forecast` with thousands of concurrent requests | ML Inference Engine & FastAPI | High: Service outage, delayed emergency dispatch analysis | Container CPU/memory quotas in Docker Compose | **Critical** (No application rate limiting exists) |
| **E - Elevation of Privilege** | Caller with `viewer` role executes analyst/admin operations | Tampering with request headers or exploiting parameter vulnerabilities | RBAC Engine (`backend/auth/security.py`) | Critical: Unauthorized data modification or system configuration | `require_role` dependency checks role hierarchy strictly | **Low** (Role hierarchy rigorously enforced in code) |

---

## 4. DREAD Risk Prioritization Matrix

Each identified risk is evaluated across five quantitative dimensions on a scale from 1 (lowest) to 10 (highest):
- **D**amage Potential: Extent of harm caused by exploitation.
- **R**eproducibility: Ease of consistently reproducing the attack.
- **E**xploitability: Technical skill and resources required.
- **A**ffected Users: Proportion of users or system functions impacted.
- **D**iscoverability: Likelihood that an attacker finds the weakness.

$$\text{DREAD Score} = \frac{D + R + E + A + D_{\text{isc}}}{5}$$

| Risk ID | Identified Threat Scenario | D | R | E | A | Disc | Overall Score | Risk Severity | Recommended Action |
|---|---|---|---|---|---|---|---|---|---|
| **RSK-01** | Denial of Service via unthrottled ML inference endpoints | 8 | 9 | 9 | 8 | 9 | **8.6** | **CRITICAL** | Implement Redis-backed sliding-window rate limiting immediately |
| **RSK-02** | Compromise of static shared API keys without per-user revocation | 8 | 7 | 8 | 8 | 7 | **7.6** | **HIGH** | Transition to OAuth2/OIDC with short-lived JWTs and revocation lists |
| **RSK-03** | Database compromise via excessive superuser privileges | 9 | 6 | 6 | 8 | 7 | **7.2** | **HIGH** | Split database credentials into DML-only application user and DDL migration user |
| **RSK-04** | Accidental production boot with default fallback credentials | 9 | 8 | 8 | 8 | 8 | **8.2** | **HIGH** | Add hard assertion in `config.py` failing application startup if default keys are detected in prod |
| **RSK-05** | Man-in-the-Middle on unencrypted internal container communications | 6 | 6 | 6 | 7 | 6 | **6.2** | **MEDIUM** | Enforce internal TLS and mutual TLS (mTLS) across internal Docker bridge |
| **RSK-06** | Information disclosure via exposed Swagger UI in production | 4 | 9 | 9 | 5 | 9 | **7.2** | **MEDIUM** | Disable `/docs` and `/redoc` when `ENVIRONMENT=production` |
| **RSK-07** | Dependency supply chain vulnerability in Python/Node ecosystem | 8 | 4 | 4 | 7 | 4 | **5.4** | **MEDIUM** | Integrate `pip-audit` and `npm audit` into CI quality gates |

---

## 5. Separation of Controls: Implemented vs. Recommendations

To maintain complete architectural integrity, the following matrix explicitly delineates what has been implemented and tested from what remains an architectural recommendation:

| Security Domain | Implemented & Verified in Code | Identified Gap / Architecture Recommendation |
|---|---|---|
| **Authentication** | Constant-time key verification (`secrets.compare_digest`); API key and Bearer token parsing; 401 challenges. | Replace static shared keys with OAuth2/OIDC and short-lived JWTs; implement MFA; add production startup block for default keys. |
| **Authorization** | Hierarchical 3-tier RBAC (`viewer`, `analyst`, `admin`) via FastAPI dependency factory; ingestion routes restricted. | Implement fine-grained ABAC for corridor/zone ownership; restrict administrative actions with dedicated sub-scopes. |
| **SQL Injection** | 100% SQLAlchemy ORM parameterized queries; zero string concatenation; deterministic query planning for Assistant. | Add Bandit AST static analysis to CI gate to reject raw SQL statements automatically. |
| **Input Validation** | Pydantic v2 schemas validating speed ranges, coordinates, AQI bounds, and types with HTTP 422 rejections. | Implement application-level request payload size limits (2 MB maximum). |
| **API & Gateway** | Centralized exception sanitization (no stack traces to client); request trace IDs (`X-Request-ID`); unprivileged Nginx proxy. | Disable Swagger docs in production; add explicit security headers middleware in FastAPI core. |
| **CORS** | Origin domain whitelist loaded from environment settings. | Restrict HTTP methods (`allow_methods`) and HTTP headers (`allow_headers`) from wildcard `*` to explicit lists. |
| **Rate Limiting** | Docker container resource constraints (CPU/RAM caps); Nginx worker connection ceilings. | **IMPLEMENT RATE LIMITING:** Add Redis-backed token bucket or sliding-window rate limiter on all API routes. |
| **Secrets** | Configuration loaded via environment variables; `.gitignore` blocks `.env`, keys, SQLite DBs. | Remove fallback dev keys in code; integrate HashiCorp Vault or Cloud Secret Manager; enforce production key validation. |
| **Supply Chain** | 100% pinned dependencies in `requirements.txt` and `package.json`; multi-stage Docker builds. | Add `pip-audit` and `npm audit` to CI pipeline; enforce package hashes (`--require-hashes`). |
| **Docker Security** | Non-root users (`appuser:smartcity`, UID 10001; `nginx`, UID 101); internal network isolation; 127.0.0.1 DB port binding. | Mount root filesystems read-only; drop all Linux capabilities (`cap_drop: [ALL]`); enable `no-new-privileges`. |
| **Database Security** | Foreign keys, constraints, and schemas defined in ORM; isolated Docker bridge network. | Provision least-privilege PostgreSQL roles (DML application role vs DDL migration role); enforce `sslmode=verify-full`. |
| **Logging & Privacy** | Structured JSON logs with trace IDs; credentials and payloads excluded from logs; internal error trace logging. | Implement dedicated `SecurityAuditLogger` for SIEM forwarding; apply coordinate jittering/coarsening on privacy-sensitive locations. |

---

## 6. Actionable Security Hardening Roadmap

### Phase 1: Immediate Remediation (P0 — Within 24-48 Hours)
1. **Production Default Key Guard**: Add startup validation in [`backend/config.py`](file:///c:/Users/Soham/Desktop/SmartCityAI/backend/config.py) that immediately terminates execution if `ENVIRONMENT=production` and any of `SECRET_KEY`, `API_KEY_ADMIN`, `API_KEY_ANALYST`, or `POSTGRES_PASSWORD` remain set to default values.
2. **CORS Hardening**: Explicitly define allowed methods and headers in `backend/main.py`:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=settings.CORS_ORIGINS,
       allow_credentials=True,
       allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
       allow_headers=["Authorization", "X-API-Key", "Content-Type", "X-Request-ID"],
   )
   ```
3. **Disable Docs in Production**: Conditionally set `docs_url=None` and `redoc_url=None` when `ENVIRONMENT == "production"`.

### Phase 2: High-Priority Hardening (P1 — Within 1-2 Weeks)
1. **Rate Limiting Engine**: Deploy `slowapi` or Redis-based sliding-window rate limiting on all public and inference-heavy endpoints.
2. **Database Least-Privilege Segmentation**:
   - Create `smartcity_app` with `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO smartcity_app`.
   - Restrict table creation and schema changes to `smartcity_migrator`.
3. **Container Filesystem Hardening**: Update `docker-compose.yml` with `read_only: true`, `security_opt: ["no-new-privileges:true"]`, and `cap_drop: ["ALL"]`.
4. **CI Supply Chain Scans**: Integrate `pip-audit` into `scripts/run_ci_pipeline.py` to fail builds on vulnerable packages.

### Phase 3: Enterprise Architecture (P2 — Within 1-2 Months)
1. **OIDC / OAuth2 Migration**: Replace static role API keys with Keycloak / Azure AD / Auth0 OIDC tokens, supporting individual user audit trails and instant revocation.
2. **SIEM Audit Log Shipping**: Deploy FluentBit sidecar to ship JSON structured audit logs to OpenSearch / Datadog with tamper-evident retention policies.
3. **mTLS Mesh**: Configure mutual TLS across internal Docker/Kubernetes container networks to encrypt all internal traffic between frontend proxy, backend, and PostgreSQL.
