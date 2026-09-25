# SmartCityAI Model Evaluation Report — traffic_test_model

**Evaluation Status**: 🟢 PASSED (ELIGIBLE FOR PRODUCTION)
- **Model Version**: `v_5a7b17ad`
- **MLflow Run ID**: `5a7b17ad06d24b53b33c0a6950ed9917`
- **Dataset Lineage**: `traffic_telemetry-v_27409a8ba5`
- **Timestamp**: `2026-09-25T19:00:56.062413+00:00`

## 1. Quantitative Performance Metrics

| Metric | Measured Value | Standard Benchmark Threshold | Status |
| :--- | :--- | :--- | :--- |
| `mae` | **1.3260** | Defined in Quality Gate | ✅ Verified |
| `rmse` | **1.5880** | Defined in Quality Gate | ✅ Verified |
| `interval_coverage` | **0.8750** | Defined in Quality Gate | ✅ Verified |
| `latency_p95_ms` | **0.0800** | Defined in Quality Gate | ✅ Verified |

## 3. Governance Certification & Non-Causal Epistemic Notice
> [!NOTE]
> This model evaluation report was automatically generated following strict time-aware validation.
> Reported metrics represent statistical correlations on historical holdout partitions and do not
> imply deterministic causal outcomes in physical urban traffic dynamics.
