# SmartCityAI — Enterprise Urban Intelligence & Decision-Support Platform

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React 18](https://img.shields.io/badge/React-18.2+-61DAFB.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6.svg)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg)](https://tailwindcss.com)
[![LightGBM](https://img.shields.io/badge/ML-LightGBM%20%7C%20TreeSHAP-brightgreen.svg)](https://lightgbm.readthedocs.io/)
[![Pytest Fleet](https://img.shields.io/badge/Pytest-82%2F82%20Passing-success.svg)](tests/)
[![Vitest Fleet](https://img.shields.io/badge/Vitest-20%2F20%20Passing-success.svg)](frontend/src/__tests__/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> **Collect → Validate → Analyze → Predict → Detect → Explain → Recommend → Visualize → Monitor**

SmartCityAI is a production-grade, enterprise-ready Urban Intelligence and Decision-Support Platform engineered for municipal departments, traffic operations centers, public safety dispatchers, and urban planning researchers. The platform unifies multimodal sensor streams, historical incident archives, and environmental telemetry into a coherent operational command center.

---

## 🌐 Localhost Access & Live Service Links

When running the project locally, access the platform services directly via these links:

| Service / Interface | Localhost Link | Alternative IP Link | Purpose |
|---|---|---|---|
| **🖥️ Frontend Web Application** | **[http://localhost:5173](http://localhost:5173)** | **[http://127.0.0.1:5173](http://127.0.0.1:5173)** | Interactive Dashboard, Leaflet Map, Quantile Forecaster & Assistant |
| **📚 In-App Documentation Center** | **[http://localhost:5173](http://localhost:5173)** | **[http://127.0.0.1:5173](http://127.0.0.1:5173)** | User Manuals, FAQ, Role Paths & Hotkeys (Navigate to *User Guide & Docs* or press `?`) |
| **⚡ Backend API Swagger Docs** | **[http://localhost:8000/docs](http://localhost:8000/docs)** | **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)** | Interactive OpenAPI Swagger UI to execute and test API routes live |
| **📖 Backend API ReDoc** | **[http://localhost:8000/redoc](http://localhost:8000/redoc)** | **[http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)** | Clean, formal API reference documentation |
| **🩺 System Health Diagnostics** | **[http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)** | **[http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)** | Real-time database pool & ML model fleet readiness status |
| **🚦 Live Traffic Telemetry & Forecasts** | **[http://localhost:8000/api/v1/traffic/speed](http://localhost:8000/api/v1/traffic/speed)** | **[http://127.0.0.1:8000/api/v1/traffic/speed](http://127.0.0.1:8000/api/v1/traffic/speed)** | Corridor speed monitoring and 90% quantile forecasts |
| **🛡️ Safety & H3 Risk Hexagons** | **[http://localhost:8000/api/v1/safety/risk](http://localhost:8000/api/v1/safety/risk)** | **[http://127.0.0.1:8000/api/v1/safety/risk](http://127.0.0.1:8000/api/v1/safety/risk)** | Empirical Bayes smoothed crash hazard classifications |

---

## 🏛️ System Overview & Architecture

```
[Municipal Data Streams] ──▶ [Preflight Validation Gates] ──▶ [Analytical Data Store]
   (Traffic, Safety, AQI)        (Nulls, Bounds, Coords)       (PostgreSQL / SQLite)
                                                                       │
                                     ┌─────────────────────────────────┴─────────────────────────────────┐
                                     ▼                                                                   ▼
                         [Predictive ML Engine]                                              [Geospatial Intelligence]
                       • LightGBM Quantile Regressor                                        • Uber H3 Hexagonal Binning
                       • 90% Prediction Intervals [q0.05, q0.95]                            • Empirical Bayes Rate Smoothing
                       • TreeSHAP Feature Attributions                                      • DBSCAN Incident Hotspots
                                     │                                                                   │
                                     └─────────────────────────────────┬─────────────────────────────────┘
                                                                       ▼
                                                          [Urban Analytics Assistant]
                                                          • Deterministic Query Planner
                                                          • Grounded FactGraph Store
                                                          • Zero Numerical Hallucination
                                                                       │
                                                                       ▼
                                                        [Executive Command Center]
                                                        • Real-Time Multimodal KPIs
                                                        • 60 FPS HTML5 Canvas Map
                                                        • Human-in-the-Loop Review
```

---

## ✨ Key Platform Capabilities

### 1. 🚦 Traffic Intelligence & Non-Parametric Quantile Forecasting
* **Calibrated Uncertainty Bounds**: Foregoes naive point predictions in favor of non-parametric LightGBM quantile regression $[q_{0.05}, q_{0.50}, q_{0.95}]$.
* **90% Prediction Interval Coverage**: Formally guaranteed through asymmetric pinball loss optimization, enabling dispatchers to anticipate traffic volatility.
* **Corridor Monitoring**: Multi-horizon forecasts across 1, 3, 6, and 24-hour dispatch horizons with zero data leakage.

### 2. 🗺️ Geospatial Intelligence & Spatial Analytics
* **Uber H3 Hexagonal Grid**: High-resolution spatial tessellation partition of metropolitan regions.
* **Empirical Bayes Rate Smoothing**: Shrinks small-sample variance in low-exposure residential corridors toward regional priors, eliminating false-positive hazard flags.
* **DBSCAN Spatial Hotspots**: Density-based clustering identifies true collision blackspots with Getis-Ord Gi* statistical significance.
* **Hardware-Accelerated HTML5 Canvas**: Delivers butter-smooth 60 FPS interactive panning and zooming even with thousands of vector polygons.

### 3. 🛡️ Road Safety Classification & TreeSHAP Explainability
* **Hazard Severity Tiers**: Standardized risk ratings (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) computed from geometric road characteristics, weather, lighting, and speed differentials.
* **Exact TreeSHAP Attributions**: Game-theoretic Shapley decomposition shows the exact directional contribution of every feature.
* **Epistemic Causal Guard**: Explicit system disclaimers prevent correlation-causation fallacies (e.g., distinguishing observed statistical association from causal intervention).

### 4. 🤖 AI-Powered Urban Analytics Assistant
* **Deterministic Query Planning**: Natural language queries are decomposed into structured analytical filters (`time_range`, `corridor_id`, `metric_type`) rather than hallucinated via unconstrained LLM calls.
* **FactGraph Grounding**: Every metric in the assistant response is linked directly to verified database rows or active model inference tensors.
* **Zero Hallucination Guarantee**: Returns explicit *“Insufficient verified platform telemetry”* notifications whenever ground-truth data is missing.

### 5. 💡 Human-in-the-Loop Decision Support & Recommendations
* **Automated Intervention Generation**: Synthesizes rule-based guidelines, predictive ML outputs, and spatial hotspot evidence.
* **Multi-Factor Priority Scoring**: Deterministically weighted based on Severity (40%), Confidence (25%), Urgency (20%), and Corridor Exposure (15%).
* **Full Audit Trail Lifecycle**: `NEW` ➔ `UNDER REVIEW` ➔ `ACCEPTED` / `REJECTED` ➔ `IN PROGRESS` ➔ `COMPLETED` with mandatory human reviewer notes.

### 6. 📚 Integrated User Guidance & Onboarding Center
* **First-Time User Onboarding**: Persistent welcome modal explaining system principles (*Analyze → Predict → Understand → Recommend → Act*).
* **Interactive 5-Step Product Tour**: Live guided tour taking users through the Dashboard, Map, Forecasting, Safety, and Solutions modules.
* **Instant Help Center Modal**: Accessible via the `? Help` button or pressing `?` / `Shift + /`.
* **Full-Page Knowledge Base (`/docs`)**: 11 detailed manuals covering preflight data validation, mathematical formulas, role-based workflows, and troubleshooting trees.
* **Accessible Hotkeys**: `Esc` (Close), `D` (Dashboard), `M` (Map), `T` (Traffic), `S` (Safety), `A` (Assistant), `?` (Help).

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend API** | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2.0, SQLite / PostgreSQL |
| **Machine Learning** | LightGBM, Scikit-learn, TreeSHAP, Uber H3-py, MLflow |
| **Frontend UI** | React 18, TypeScript 5.3, Vite 5.4, Tailwind CSS 3.4, Lucide Icons, Leaflet / HTML5 Canvas |
| **Data Pipelines** | Pandas, NumPy, Automated Chronological Splitters, Feature Stores |
| **Testing & CI** | Pytest (82 tests), Vitest (20 tests), Coverage, Flake8, Black |

---

## 🚀 Quickstart & Installation

### Prerequisites
* **Python**: 3.11 or higher
* **Node.js**: v18.0 or higher (v20+ recommended)
* **Git**: Installed and configured

### 1. Clone the Repository
```bash
git clone https://github.com/Duchalsoham12/SMART-CITY-AI.git
cd SMART-CITY-AI
```

### 2. Backend Setup
```bash
# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run backend test fleet
python -m pytest -q

# Launch FastAPI backend daemon (Port 8000)
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install npm dependencies
npm install

# Run frontend test fleet
npm test

# Build production bundle
npm run build

# Start local development server (Port 5173)
npm run dev -- --host 127.0.0.1 --port 5173
```

### 4. Access the Live Application Locally

Once both backend and frontend servers are launched:

* 🖥️ **Frontend Dashboard**: Open **[http://localhost:5173](http://localhost:5173)** (or **[http://127.0.0.1:5173](http://127.0.0.1:5173)**)
* ⚡ **Interactive API Swagger UI**: Open **[http://localhost:8000/docs](http://localhost:8000/docs)** (or **[http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)**)
* 📖 **ReDoc API Documentation**: Open **[http://localhost:8000/redoc](http://localhost:8000/redoc)**
* 🩺 **Backend Health & Model Fleet**: Open **[http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health)**
* 📚 **In-App Documentation & Guides**: Access via the sidebar (*User Guide & Docs*) or press **`?`** anywhere in the app

> **Tip**: Inside the web dashboard, toggle between **Live API (Port 8000)** and **Offline Mock** directly from the top-right header at any time.

---

## 🧪 Comprehensive Verification & Test Fleet

SmartCityAI enforces rigorous test-driven validation across the entire data engineering and machine learning lifecycle.

```bash
# Run 82 Python unit and integration tests
python -m pytest -q
# Output: 82 passed in 7.83s

# Run 20 Frontend component and guidance tests
npm --prefix frontend test
# Output: 20 passed across 5 test files in 2.39s

# Run performance benchmarking suite
python scripts/benchmark_performance.py
```

### Test Coverage Highlights
* **Zero Target Leakage Guard**: Preflight checks verify that future target values cannot contaminate historical feature windows.
* **Zero Silent Data Deletion**: Confirms that non-conforming telemetry records are flagged and quarantined rather than silently discarded.
* **Calibrated Interval Validity**: Validates that quantile lower bounds never mathematically exceed median or upper bounds ($q_{0.05} \le q_{0.50} \le q_{0.95}$).
* **Assistant Grounding**: Validates that questions with non-existent data return deterministic refusals rather than hallucinated estimates.

---

## 📖 Complete Documentation Index

Extensive enterprise-grade architecture and research specifications are available in the [`docs/`](docs/) directory:

1. [**System Architecture Specification**](docs/ARCHITECTURE.md) — Comprehensive high-level system diagrams, component bounds, and design patterns.
2. [**Backend API Specification**](docs/BACKEND_API_SPEC.md) — Detailed REST endpoints, request/response schemas, and error codes.
3. [**Data Pipeline Specification**](docs/DATA_PIPELINE_SPEC.md) — Preflight data validation, cleaning, and quarantine mechanisms.
4. [**Forecasting Subsystem Specification**](docs/FORECASTING_SUBSYSTEM_SPEC.md) — Mathematical formulation of LightGBM quantile regression and coverage proofs.
5. [**Geospatial Intelligence Specification**](docs/GEOSPATIAL_INTELLIGENCE_SPEC.md) — Uber H3 grid tessellation, Empirical Bayes smoothing, and DBSCAN algorithms.
6. [**Explainable AI & Causal Guard**](docs/EXPLAINABLE_AI_SPEC.md) — TreeSHAP implementation, Shapley game theory, and causal guardrails.
7. [**Urban Analytics Assistant Specification**](docs/URBAN_ANALYTICS_ASSISTANT_SPEC.md) — FactGraph deterministic retrieval architecture and audit logging.
8. [**MLOps & Model Lifecycle Specification**](docs/MLOPS_WORKFLOW_SPEC.md) — Dataset versioning, experiment tracking, PSI drift detection, and retraining triggers.
9. [**Security Review & Threat Model**](docs/SECURITY_REVIEW_AND_THREAT_MODEL.md) — OWASP API security, STRIDE threat model, RBAC policies, and input sanitization.
10. [**Performance Engineering & Benchmarks**](docs/PERFORMANCE_ENGINEERING_SPEC.md) — Query indexes, memory profiling, latency budgets, and concurrency benchmarks.
11. [**University Project Documentation & Thesis**](docs/UNIVERSITY_PROJECT_DOCUMENTATION.md) — Complete 24-chapter final-year B.Tech academic documentation with literature survey and experimental results.
12. [**Deployment & Infrastructure Guide**](docs/DEPLOYMENT_GUIDE.md) — Containerization, systemd services, reverse proxies, and production configuration.

---

## ⚖️ Epistemic Distinction Standard

SmartCityAI adheres to an uncompromising standard of transparency:
* **Observed Data**: Ground-truth historical facts collected from verified physical sensors and municipal incident reports.
* **Model Predictions**: Probabilistic estimations computed under environmental uncertainty, presented with calibrated 90% confidence envelopes.
* **Recommendations**: Decision-support proposals generated for human evaluation; the platform never actuates physical infrastructure or emergency units autonomously.

---

## 📄 License & Attribution

This project is licensed under the [MIT License](LICENSE).

Developed as a state-of-the-art final-year **B.Tech in Artificial Intelligence & Data Science** project by **Soham Duchal**.
Repository: [https://github.com/Duchalsoham12/SMART-CITY-AI](https://github.com/Duchalsoham12/SMART-CITY-AI)
