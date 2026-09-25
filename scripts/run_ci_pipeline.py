"""
SmartCityAI - Local Continuous Integration & Quality Gate Runner
Runs all 10 Quality Gates sequentially. Exits with non-zero status code
immediately if any critical gate fails.
"""

import subprocess
import sys
import time

GATES = [
    {
        "id": "GATE-01",
        "name": "Data Validation & Schema Boundary Tests",
        "cmd": [sys.executable, "-m", "pytest", "tests/test_schemas.py", "tests/test_data_validation.py", "tests/test_cleaning.py", "-q"],
        "cwd": ".",
    },
    {
        "id": "GATE-02",
        "name": "Database ACID & Transaction Integrity Tests",
        "cmd": [sys.executable, "-m", "pytest", "tests/test_database.py", "-q"],
        "cwd": ".",
    },
    {
        "id": "GATE-03",
        "name": "Zero Data Leakage Invariant Gate",
        "cmd": [sys.executable, "-m", "pytest", "tests/test_leakage.py", "-q"],
        "cwd": ".",
    },
    {
        "id": "GATE-04",
        "name": "ML Pipelines, MLOps & Model Serialization Tests",
        "cmd": [sys.executable, "-m", "pytest", "tests/test_ml_models.py", "tests/test_ml_pipeline.py", "tests/test_mlops.py", "-q"],
        "cwd": ".",
    },
    {
        "id": "GATE-05",
        "name": "Metamorphic Model Inference & Latency Tests",
        "cmd": [sys.executable, "-m", "pytest", "tests/test_model_inference.py", "tests/test_forecasting.py", "tests/test_geospatial.py", "-q"],
        "cwd": ".",
    },
    {
        "id": "GATE-06",
        "name": "Model Drift (PSI < 0.25) & Golden Regression Gates",
        "cmd": [sys.executable, "-m", "pytest", "tests/test_model_drift.py", "tests/test_regression.py", "-q"],
        "cwd": ".",
    },
    {
        "id": "GATE-07",
        "name": "FastAPI REST Endpoints, XAI & AI Assistant Grounded Tests",
        "cmd": [sys.executable, "-m", "pytest", "tests/test_backend_api.py", "tests/test_xai.py", "tests/test_assistant.py", "-q"],
        "cwd": ".",
    },
    {
        "id": "GATE-08",
        "name": "End-to-End System Integration Lifecycle Test",
        "cmd": [sys.executable, "-m", "pytest", "tests/test_e2e_workflow.py", "-q"],
        "cwd": ".",
    },
    {
        "id": "GATE-09",
        "name": "Frontend Vitest Component & ApiClient Suite",
        "cmd": ["npm", "test"],
        "cwd": "./frontend",
    },
    {
        "id": "GATE-10",
        "name": "Frontend Production Vite Bundle Build",
        "cmd": ["npm", "run", "build"],
        "cwd": "./frontend",
    },
]


def main():
    print("=" * 80)
    print(" SmartCityAI — Continuous Integration & Quality Gates Pipeline")
    print("=" * 80)
    start_total = time.time()
    failed_gates = []

    for gate in GATES:
        print(f"\n[RUNNING] {gate['id']}: {gate['name']} ...")
        t0 = time.time()
        res = subprocess.run(gate["cmd"], cwd=gate["cwd"], shell=True)
        duration = time.time() - t0

        if res.returncode == 0:
            print(f"[PASSED]  {gate['id']}: {gate['name']} ({duration:.2f}s)")
        else:
            print(f"[FAILED]  {gate['id']}: {gate['name']} (Exit Code {res.returncode})")
            failed_gates.append(gate["id"])
            # Fail fast rule for critical CI pipeline
            print(f"\nCRITICAL FAILURE: Pipeline halted at {gate['id']}.")
            sys.exit(1)

    total_duration = time.time() - start_total
    print("\n" + "=" * 80)
    print(f" ALL 10 QUALITY GATES PASSED CLEANLY IN {total_duration:.2f}s")
    print("=" * 80)
    sys.exit(0)


if __name__ == "__main__":
    main()
