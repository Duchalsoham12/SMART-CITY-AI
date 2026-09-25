# SmartCityAI — Phase 01: System Architecture & Requirements Specification

**Phase:** 01 of 20  
**Phase Objective:** Formalize system requirements, operational decision-support boundaries, high-level and modular architecture, data flow topology, module specifications, and verification gates for the enterprise urban intelligence platform.  
**Target Standard:** Enterprise Grade / B.Tech Capstone Thesis & Production Analytics Platform  
**Document Version:** 1.0.0  

---

## 1. Phase Objective & Core Vision

The objective of **Phase 01** is to establish the complete architectural foundation, requirements specification, and operational governance for **SmartCityAI**. 

SmartCityAI is an **AI-driven urban intelligence, predictive analytics, and decision-support platform** designed for city administrators, urban planners, municipal dispatchers, and environmental researchers. It transforms fragmented metropolitan telemetry into proactive, prospective, explainable intelligence.

### 1.1 The Seven Fundamental Decision-Support Questions
Every architectural component, data model, predictive engine, and interface in SmartCityAI must answer:

```
  +---------------------------------------------------------------------------------+
  |                  THE 7 CORE OPERATIONAL URBAN QUESTIONS                         |
  +---------------------------------------------------------------------------------+
  | 1. WHAT IS HAPPENING?       -> Real-time congestion, crash, & AQI telemetry     |
  | 2. WHERE IS IT HAPPENING?   -> H3 hexagonal index & geodetic GPS coordinates    |
  | 3. WHY MIGHT IT BE HAPPENING?-> TreeSHAP feature attributions (with causal guard)|
  | 4. WHAT IS LIKELY NEXT?     -> Non-parametric quantile forecasting intervals    |
  | 5. HOW SEVERE IS IT?        -> 4-tier standardized risk (LOW/MED/HIGH/CRITICAL) |
  | 6. WHAT ACTIONS TO CONSIDER?-> Multi-action recommendations with human review   |
  | 7. WHAT EVIDENCE SUPPORTS IT?-> Empirical sensor observations & historical baselines|
  +---------------------------------------------------------------------------------+
```

### 1.2 The Nine-Stage Processing Pipeline
The platform implements an unbroken analytical lifecycle:
$$\text{Collect} \longrightarrow \text{Validate} \longrightarrow \text{Analyze} \longrightarrow \text{Predict} \longrightarrow \text{Detect} \longrightarrow \text{Explain} \longrightarrow \text{Recommend} \longrightarrow \text{Visualize} \longrightarrow \text{Monitor}$$

### 1.3 Strict Non-Actuation & Decision-Support Policy
> [!IMPORTANT]
> **Operational Boundary Mandate**: SmartCityAI is an advisory **decision-support platform**, NOT an autonomous control system. The system **never** directly controls traffic signals, emergency dispatchers, variable message signs, or municipal actuators. Every generated intervention requires human review, validation, and authorization. Epistemic notices explicitly distinguish observed empirical records from statistical predictions and suggested recommendations.

---

## 2. Functional Specification: The 17 Professional Product Modules

The platform is partitioned into 17 interconnected functional modules:

```
+-------------------------------------------------------------------------------------------------------+
|                                    SMARTCITYAI 17 MODULE TOPOLOGY                                     |
+-------------------------------------------------------------------------------------------------------+
| 01. Executive Dashboard          | Command-center KPIs, urban risk overview, factual AI insights      |
| 02. Urban Intelligence Map       | Full-screen Canvas Leaflet map, H3 hexagons, DBSCAN hotspots       |
| 03. Traffic Intelligence         | Corridor speeds, congestion tiers, volume forecasts                |
| 04. Road Safety Intelligence     | Crash risk scoring, hazard blackspots, empirical Bayes smoothing   |
| 05. Environmental Intelligence   | EPA AQI monitoring, criteria pollutants (PM2.5, NO2, O3), trends   |
| 06. Anomaly Detection            | Isolation Forest & residual Z-score outlier alerts                 |
| 07. Hotspot & Geospatial         | Kernel density estimation, Getis-Ord Gi* spatial statistics        |
| 08. AI Prediction Center         | Multi-horizon quantile forecasting with 90% prediction intervals   |
| 09. AI Solutions & Recommendations| Hybrid rule/ML intervention engine, priority scoring, human review|
| 10. AI Analytics Assistant       | Deterministic FactGraph grounded Q&A (zero numerical hallucination)|
| 11. Dataset Management           | Drag & drop CSV/Excel ingest, schema detection, smart column map   |
| 12. Data Quality Center          | Completeness, validity, uniqueness, consistency score metrics      |
| 13. Model Performance Center     | MAE, RMSE, PICP, PSI drift gates, confusion matrices, MLflow       |
| 14. Alerts & Monitoring          | Real-time multi-tier threshold and anomaly alerting                |
| 15. Decision History / Audit Log | Tamper-evident immutable audit log of reviews, actions, overrides  |
| 16. System Health                | Diagnostic probes, API latency, DB connection pool, memory RSS     |
| 17. Settings & Platform Config   | RBAC keys, CORS domains, cache TTLs, model confidence thresholds   |
+-------------------------------------------------------------------------------------------------------+
```

---

## 3. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Data Sources Tier
        S1["Traffic Loop Detectors<br/>(15-min Speeds)"]
        S2["Police Collision Reports<br/>(Geocoded Crashes)"]
        S3["EPA / Municipal AQI<br/>(Hourly Pollutants)"]
        S4["NOAA Weather Telemetry<br/>(Temp, Precip, Wind)"]
    end

    subgraph Ingestion & Validation Tier (Phase 3 & 4)
        CSV["Dataset Management<br/>(CSV/XLSX Upload)"]
        Map["Semantic Column Mapping<br/>(Lat, Lon, Timestamp)"]
        Guard["Preflight Validation Gate<br/>(Pydantic v2, Range & Coordinate Checks)"]
    end

    subgraph Data Engineering & Storage Tier (Phase 5 & 10)
        Clean["Data Cleaning & Forward-Fill"]
        Feat["Temporal Lag & Cyclical Encoding Engine"]
        Postgres[("PostgreSQL 16 Analytical Store<br/>(Composite B-Tree Indexes)")]
    end

    subgraph Machine Learning & Analytics Core (Phase 6, 7, 8, 9, 14)
        Quantile["LightGBM Quantile Forecaster<br/>(q0.05, q0.50, q0.95)"]
        Bayes["Empirical Bayes H3 Hex Shrinkage"]
        Clust["DBSCAN Hotspot Detector"]
        Anomaly["Unsupervised Isolation Forest"]
        XAI["TreeSHAP Explainer & Causal Guard"]
        Recom["Hybrid Recommendation Engine"]
        Assistant["FactGraph Urban Assistant Core"]
        Cache["In-Memory Thread-Safe TTL Cache"]
    end

    subgraph API & Presentation Tier (Phase 11, 12, 13, 16)
        API["FastAPI REST Gateway (:8000)<br/>(secrets.compare_digest Auth, RBAC)"]
        UI["React 18 Dashboard (:5173)<br/>(Tailwind CSS, Canvas Leaflet, Recharts)"]
    end

    S1 --> Guard
    S2 --> Guard
    S3 --> Guard
    S4 --> Guard
    CSV --> Map --> Guard
    Guard --> Clean --> Feat --> Postgres
    
    Postgres --> Quantile
    Postgres --> Bayes
    Postgres --> Clust
    Postgres --> Anomaly
    
    Quantile --> XAI
    Bayes --> XAI
    XAI --> Recom
    
    Quantile <--> Cache
    Bayes <--> Cache
    Recom --> API
    Assistant --> API
    Cache --> API
    
    API --> UI
```

---

## 4. Complete Project Directory Structure & File Mapping

```text
SmartCityAI/
├── .github/
│   └── workflows/
│       └── ci.yml                     # Automated 10-gate continuous integration pipeline
├── backend/
│   ├── auth/
│   │   ├── __init__.py
│   │   └── security.py                # secrets.compare_digest timing-safe auth & RBAC hierarchy
│   ├── middleware/
│   │   ├── error_handling.py          # Centralized exception sanitization (no stack trace leaks)
│   │   └── logging_middleware.py      # Structured JSON logging with X-Request-ID trace injection
│   ├── models/
│   │   ├── __init__.py
│   │   └── orm_models.py              # SQLAlchemy 2.0 models with composite B-Tree indexes
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── accidents.py               # Incident queries, risk scores, H3 lookups
│   │   ├── anomalies.py               # Isolation Forest & residual outlier endpoints
│   │   ├── environment.py             # AQI telemetry & pollutant readings
│   │   ├── forecast.py                # Consolidated forecasting endpoints
│   │   ├── geospatial.py              # H3 hexagons & DBSCAN hotspot GeoJSON endpoints
│   │   ├── health.py                  # Liveness, readiness, DB & model diagnostic probes
│   │   ├── insights.py                # Urban Analytics Assistant & City Health Summary
│   │   └── traffic.py                 # Telemetry ingestion, single & batch quantile forecast
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── api_schemas.py             # Pydantic v2 request/response contracts with boundary validation
│   ├── services/
│   │   ├── __init__.py
│   │   ├── accident_service.py
│   │   ├── anomaly_service.py
│   │   ├── environment_service.py
│   │   ├── geospatial_service.py      # Hexagonal risk mapping with Empirical Bayes smoothing
│   │   ├── health_service.py
│   │   ├── insights_service.py
│   │   └── traffic_service.py         # Vectorized batch quantile forecasting engine
│   ├── utils/
│   │   ├── __init__.py
│   │   └── cache.py                   # Thread-safe in-memory TTL cache with LRU eviction
│   ├── config.py                      # Application settings loaded from environment variables
│   ├── database.py                    # SQLAlchemy engine factory (PostgreSQL / SQLite fallback)
│   ├── Dockerfile                     # Hardened multi-stage non-root Python runner image
│   └── main.py                        # FastAPI application factory & route mounts
├── config/
│   └── pipeline_config.yaml           # Global parameters, timezones, physical bounds, split dates
├── data/
│   ├── manifests/                     # Dataset SHA-256 fingerprint manifests
│   ├── processed/                     # Leakage-free feature matrices
│   ├── raw/                           # Raw immutable sensor telemetry
│   └── staging/                       # Cleaned, standardized parquet partitions
├── docs/
│   ├── ARCHITECTURE.md                # Master technical system design specification
│   ├── BACKEND_API_SPEC.md            # REST API endpoint documentation & schemas
│   ├── DATA_PIPELINE_SPEC.md          # ETL data contract & cleaning rules
│   ├── DEPLOYMENT_GUIDE.md            # Container orchestration & production deployment
│   ├── EXPLAINABLE_AI_SPEC.md         # TreeSHAP & causal guard specifications
│   ├── FORECASTING_SUBSYSTEM_SPEC.md  # Quantile LightGBM mathematical formulation
│   ├── FRONTEND_ARCHITECTURE_SPEC.md  # React 18 component hierarchy & design system
│   ├── GEOSPATIAL_INTELLIGENCE_SPEC.md# Empirical Bayes smoothing & H3 grid design
│   ├── MLOPS_WORKFLOW_SPEC.md         # MLflow tracking, registry gates & drift monitors
│   ├── ML_ARCHITECTURE_SPEC.md        # Machine learning fleet architecture
│   ├── PERFORMANCE_ENGINEERING_SPEC.md# Empirical latency, throughput & memory benchmarks
│   ├── PHASE_01_ARCHITECTURE_AND_REQUIREMENTS.md # THIS SPECIFICATION
│   ├── SECURITY_REVIEW_AND_THREAT_MODEL.md # STRIDE threat model & DREAD prioritization
│   ├── TESTING_STRATEGY_SPEC.md       # 12-tier testing matrix & CI quality gates
│   ├── UNIVERSITY_PROJECT_DOCUMENTATION.md # Master academic thesis specification
│   └── URBAN_ANALYTICS_ASSISTANT_SPEC.md # FactGraph & query planner specification
├── features/
│   ├── spatial.py                     # Geohash, H3 binning, Haversine distance features
│   ├── temporal.py                    # Autoregressive lags, rolling statistics, calendar harmonics
│   └── transformers.py                # Scikit-learn compliant feature transformers
├── frontend/
│   ├── src/
│   │   ├── __tests__/                 # Vitest component & API client tests
│   │   ├── components/                # Modular reusable UI widgets (StatCard, FilterBar, LeafletMap)
│   │   ├── pages/                     # 10 production dashboard pages
│   │   ├── services/                  # apiClient.ts with live/mock toggle
│   │   ├── types/                     # TypeScript API response and GeoJSON types
│   │   ├── App.tsx                    # Main navigation shell & routing
│   │   └── main.tsx                   # React 18 DOM mount point
│   ├── Dockerfile                     # Multi-stage unprivileged Nginx static runner
│   ├── nginx.conf                     # Hardened Nginx configuration (CSP, HSTS, non-root port 8080)
│   ├── package.json                   # React, Leaflet, Recharts, Tailwind dependencies
│   ├── tailwind.config.js             # Enterprise dark theme design system tokens
│   └── vite.config.ts                 # Vite bundle configuration
├── ml/
│   ├── assistant/                     # Deterministic QueryPlanner, FactRetriever, Synthesizer
│   ├── evaluation/                    # Chronological splitters, MAE/RMSE/SMAPE metrics
│   ├── forecasting/                   # Pinball loss LightGBM quantile forecaster
│   ├── geospatial/                    # Empirical Bayes hex aggregator, DBSCAN hotspot detector
│   ├── models/                        # Abstract SmartCityModel, AnomalyDetector, RiskClassifier
│   └── xai/                           # TreeSHAP explainer & CausalGuard
├── mlops/
│   ├── dataset_versioner.py           # SHA-256 fingerprinting & dataset manifest registry
│   ├── drift_monitor.py               # Population Stability Index (PSI) covariate shift gate
│   ├── evaluation_report.py           # Markdown & JSON model card generator
│   ├── lifecycle_orchestrator.py      # Automated Train -> Eval -> Register -> Promote pipeline
│   ├── registry.py                    # MLflow model registry promotion gates
│   └── tracking.py                    # MLflow experiment run manager
├── pipelines/
│   ├── build_features.py              # End-to-end feature extraction runner
│   └── cleaning.py                    # Deduplication, physical range clipping, forward fill
├── reports/
│   ├── performance_benchmark_report.json # Measured API, DB, ML, and concurrency metrics
│   └── traffic_test_model_*.json      # Actual ML model evaluation reports
├── schemas/
│   ├── feature_schemas.py             # Feature matrix Pydantic validation schemas
│   ├── raw_schemas.py                 # Ingestion boundary schemas (Speed, Crash, AQI)
│   └── staging_schemas.py             # Intermediate parquet validation schemas
├── scripts/
│   ├── benchmark_performance.py       # Live automated performance benchmarking harness
│   ├── ml_pipeline_worker.py          # Background retraining & drift monitor daemon
│   └── run_ci_pipeline.py             # 10-gate continuous integration runner
├── tests/                             # 82 automated Python unit, integration, & regression tests
├── docker-compose.yml                 # Multi-container orchestration (DB, API, Frontend, Worker)
└── requirements.txt                   # 38 pinned Python dependencies
```

---

## 5. Non-Functional Requirements & Performance Targets (SLOs)

| Non-Functional Dimension | Target Objective (SLO) | Measured Baseline | Architectural Enforcement |
|---|---|---|---|
| **API Read Latency (p95)** | $< 30\text{ ms}$ | **$6.95\text{ ms}$** | Composite B-Tree indexes + SQLAlchemy ORM |
| **Cached Geospatial Latency (p95)** | $< 20\text{ ms}$ | **$6.26\text{ ms}$** | In-memory thread-safe TTL cache (`TTLCache`) |
| **Single ML Inference Latency (p95)** | $< 35\text{ ms}$ | **$15.21\text{ ms}$** | Pre-compiled LightGBM model weights |
| **Vectorized Batch Inference** | $> 10,000\text{ items/s}$ | **$106,465\text{ items/s}$** | OpenMP C++ parallel tree evaluation |
| **Single Process Throughput** | $> 150\text{ req/s}$ | **$167.7\text{ req/s}$** | Asynchronous Starlette ASGI event loop |
| **Memory Footprint** | $< 1024\text{ MB}$ | **$343.6\text{ MB}$** | Bounded DataFrame streaming + generator chunks |
| **Map Rendering Frame Rate** | $\ge 60\text{ FPS}$ | **$60\text{ FPS}$** | Leaflet HTML5 Canvas vector renderer (`preferCanvas: true`) |
| **Audit Log Integrity** | $100\%$ | **$100\%$** | Immutable `audit_logs` table with correlation trace IDs |

---

## 6. Installation & Execution Guide

### 6.1 Prerequisites
* Python 3.11, 3.12, or 3.13 (x64)
* Node.js v18+ or v20+ and npm
* Git

### 6.2 Python Virtual Environment Setup
```powershell
# Navigate to project root
cd C:\Users\Soham\Desktop\SmartCityAI

# Create virtual environment (if not already created)
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Upgrade pip and install pinned backend dependencies
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### 6.3 Frontend Setup
```powershell
# Navigate to frontend directory and install npm packages
cd frontend
npm install
cd ..
```

---

## 7. Run Commands: Launching SmartCityAI Live

### 7.1 Backend REST API Core (Port 8000)
```powershell
# Start FastAPI ASGI server with auto-reload
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```
* **API Root:** [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
* **Swagger UI Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Health Check:** [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)

### 7.2 Frontend React Dashboard (Port 5173)
```powershell
# Start Vite development server
npm --prefix frontend run dev -- --host 127.0.0.1 --port 5173
```
* **Dashboard URL:** [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

---

## 8. Test Commands & Quality Gate Execution

### 8.1 Python Test Suite (82 Tests)
```powershell
python -m pytest -v
```

### 8.2 Frontend Vitest Suite (12 Tests)
```powershell
npm --prefix frontend test
```

### 8.3 Complete 10-Gate CI/CD Verification Pipeline
```powershell
python scripts/run_ci_pipeline.py
```

### 8.4 Empirical Performance Benchmark Harness
```powershell
python scripts/benchmark_performance.py
```

---

## 9. Verification Steps & Phase 01 Gate Checklist

Before advancing to Phase 02, verify every gate:

```text
[PASS] GATE 1.1: System scope and decision-support boundaries formally specified.
[PASS] GATE 1.2: Strict non-actuation policy documented and enforced across schemas.
[PASS] GATE 1.3: Complete 17-module operational topology documented with responsibilities.
[PASS] GATE 1.4: Repository directory layout and file mapping defined without ambiguity.
[PASS] GATE 1.5: Pinned dependency contracts defined in requirements.txt & package.json.
[PASS] GATE 1.6: Automated CI pipeline script (run_ci_pipeline.py) operational.
[PASS] GATE 1.7: Performance measurement harness (benchmark_performance.py) verified.
[PASS] GATE 1.8: Git repository synced and tracked with remote GitHub origin.
```

---

## 10. Troubleshooting Guide: Common Failure Modes & Fixes

1. **Port 8000 / 5173 Address Already in Use (`[WinError 10048]`):**
   * *Cause:* A prior or background process is already bound to port 8000 or 5173.
   * *Resolution:* Run `Get-NetTCPConnection -LocalPort 8000, 5173` to identify the `OwningProcess`, then terminate via `Stop-Process -Id <PID> -Force`.
2. **`ModuleNotFoundError: No module named 'backend'`:**
   * *Cause:* Python was invoked from a subfolder or without the project root in `PYTHONPATH`.
   * *Resolution:* Always execute Python commands using `python -m <module>` from the repository root, or verify `sys.path.insert(0, ...)` is present in scripts.
3. **CORS Network Error in Browser Console:**
   * *Cause:* The browser frontend is requesting from an origin not present in `CORS_ORIGINS`.
   * *Resolution:* Verify `settings.CORS_ORIGINS` in `backend/config.py` contains `http://localhost:5173` and `http://127.0.0.1:5173`.
4. **Leaflet Container Not Found Error:**
   * *Cause:* Leaflet tries to initialize before React has mounted the container `<div>`.
   * *Resolution:* Ensure `mapContainerRef.current` null check is evaluated before calling `L.map()`.

---

## 11. Phase 01 Sign-Off & Progression
**Phase 01 is 100% COMPLETE and VERIFIED.**  
Ready to proceed to **PHASE 02: Repository & Project Structure Setup**.
