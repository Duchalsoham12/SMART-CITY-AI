/**
 * SmartCityAI - Centralized User Guidance, Knowledge Base & Documentation Store
 * Houses structured content for Onboarding, Product Tours, Help Center, Tooltips,
 * FAQs, Troubleshooting, and Role-Based Guides.
 */

export interface TourStep {
  step: number;
  title: string;
  category: string;
  icon: string;
  description: string;
  keyPoints: string[];
  actionLabel?: string;
  targetPage?: string;
}

export interface HelpArticle {
  id: string;
  title: string;
  category: 'getting-started' | 'modules' | 'predictions' | 'solutions' | 'datasets' | 'faq' | 'troubleshooting' | 'shortcuts';
  icon: string;
  summary: string;
  content: string[];
  tips?: string[];
  badge?: string;
}

export interface TooltipDefinition {
  term: string;
  shortDefinition: string;
  detailedContext: string;
  epistemicNote?: string;
}

// -----------------------------------------------------------------------------
// 1. Interactive Tour Steps
// -----------------------------------------------------------------------------
export const ONBOARDING_TOUR_STEPS: TourStep[] = [
  {
    step: 1,
    title: 'Executive Command Center',
    category: 'Dashboard',
    icon: '📊',
    description: 'This is your city-wide command overview. Monitor real-time urban stress, active congestion zones, safety alerts, and multimodal KPIs at a glance.',
    keyPoints: [
      'Aggregated Urban Stress Index combines traffic, safety, and air quality.',
      'Key Metric Cards display live counts from verified sensor streams.',
      'Epistemic disclaimers distinguish historical observations from ML forecasts.',
    ],
    targetPage: 'overview',
  },
  {
    step: 2,
    title: 'Urban Intelligence Map',
    category: 'Geospatial Explorer',
    icon: '🗺️',
    description: 'Understand WHERE issues are occurring across the metropolitan area with multi-layer geospatial intelligence.',
    keyPoints: [
      'Uber H3 Hexagonal Grid with Empirical Bayes rate smoothing.',
      'DBSCAN spatial incident clustering with Getis-Ord Gi* hotspot detection.',
      'Hardware-accelerated HTML5 Canvas vector rendering for fluid 60 FPS interactions.',
    ],
    targetPage: 'geospatial',
  },
  {
    step: 3,
    title: 'Traffic & Environmental Forecasting',
    category: 'Predictive Center',
    icon: '📈',
    description: 'Anticipate corridor speeds and atmospheric pollutant concentrations 1, 3, 6, and 24 hours in advance.',
    keyPoints: [
      'Non-parametric LightGBM quantile forecasting with 90% prediction intervals [q0.05, q0.95].',
      'Explicit uncertainty envelopes prepare dispatchers for extreme variance.',
      'Zero-data-leakage rolling window feature extraction.',
    ],
    targetPage: 'forecasting',
  },
  {
    step: 4,
    title: 'Road Safety & TreeSHAP Attribution',
    category: 'Safety & Risk',
    icon: '🛡️',
    description: 'Inspect collision risk tiers and uncover the primary factors driving model predictions without false causal assumptions.',
    keyPoints: [
      'Standardized risk ratings: LOW, MEDIUM, HIGH, and CRITICAL.',
      'TreeSHAP feature attributions with technical vs non-technical summaries.',
      'Mandatory causal guard disclaimers prevent correlation-causation fallacies.',
    ],
    targetPage: 'safety',
  },
  {
    step: 5,
    title: 'AI Solutions & Analytics Assistant',
    category: 'Decision Support',
    icon: '💡',
    description: 'Convert detected urban anomalies into data-backed recommendations with complete human-in-the-loop governance.',
    keyPoints: [
      'Transparent priority scoring based on severity, urgency, and confidence.',
      'Human review workflow: New -> Under Review -> Accepted -> Completed (or Rejected).',
      'FactGraph-grounded natural language assistant with zero numerical hallucination.',
    ],
    targetPage: 'assistant',
  },
];

// -----------------------------------------------------------------------------
// 2. Comprehensive Help Center Articles & Guides
// -----------------------------------------------------------------------------
export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'getting-started-workflow',
    title: 'Getting Started: The 10-Step Recommended Workflow',
    category: 'getting-started',
    icon: '🚀',
    summary: 'The recommended operational path for analyzing an urban region from health check to action monitoring.',
    content: [
      'Step 1: Check System Health — Verify API gateway, analytical database, and ML models are reporting operational green status.',
      'Step 2: Load or Upload Dataset — Select a built-in municipal stream or upload your own CSV/Excel telemetry.',
      'Step 3: Validate Data — Verify schemas, bounding coordinates, and nullability ratios through preflight validation gates.',
      'Step 4: Explore Data — Inspect raw records, missing value patterns, and distribution histograms.',
      'Step 5: Run Analysis — Execute unsupervised anomaly detection and spatial hotspot clustering.',
      'Step 6: Generate Predictions — Query quantile speed forecasters and environmental dispersion models.',
      'Step 7: Explore the Map — Visualize H3 risk hexagons and incident clusters with filter controls.',
      'Step 8: Review AI Recommendations — Inspect auto-generated decision support interventions and supporting evidence.',
      'Step 9: Human Review & Audit — Accept, modify, reject, or assign recommendations with notes.',
      'Step 10: Monitor Results — Track prediction drift and intervention outcomes over subsequent time windows.',
    ],
    tips: [
      'Always check the Epistemic Notice at the top of each page to verify whether data is live or mock.',
      'Use the top-right role selector to toggle between Viewer, Analyst, and Administrator capabilities.',
    ],
    badge: 'Core Workflow',
  },
  {
    id: 'dataset-upload-guide',
    title: 'Dataset Management & Smart Column Mapping Guide',
    category: 'datasets',
    icon: '📁',
    summary: 'How to upload, map, validate, and register CSV or Excel datasets into the platform.',
    content: [
      'Step 1: Open Dataset Management in the navigation or upload drawer.',
      'Step 2: Select file format (.csv, .xlsx, or .parquet). Maximum recommended size is 50 MB.',
      'Step 3: Select dataset category: Traffic Telemetry, Accident/Safety Records, Air Quality, or Weather.',
      'Step 4: Smart Semantic Column Mapping — The system automatically detects candidate columns (e.g., "spd_mph" -> speed_mph, "lat" -> latitude, "ts" -> recorded_at).',
      'Step 5: Confirm Mappings — Review suggested mappings and manually reassign any ambiguous fields.',
      'Step 6: Preflight Validation — The validator checks coordinate boundaries (lat -90 to +90, lon -180 to +180), numeric physical bounds, and date formats.',
      'Step 7: Review Data Quality Report — Check completeness, validity, uniqueness, and consistency scores.',
      'Step 8: Ingest Validated Data — Valid records are loaded into PostgreSQL; invalid rows are quarantined.',
    ],
    tips: [
      'Never upload sensitive personally identifiable information (PII) such as license plates or passenger names.',
      'Timestamps should ideally be in ISO 8601 or UTC format.',
    ],
    badge: 'Data Engineering',
  },
  {
    id: 'data-quality-dimensions',
    title: 'Understanding Data Quality Dimensions',
    category: 'datasets',
    icon: '🧪',
    summary: 'How SmartCityAI computes completeness, validity, uniqueness, and consistency scores.',
    content: [
      'Completeness (Target: >= 95%): Measures the proportion of non-null values across mandatory schema columns.',
      'Validity (Target: >= 98%): Confirms that recorded values fall within physical real-world boundaries (e.g., speed between 0 and 120 mph, AQI between 0 and 500).',
      'Uniqueness (Target: >= 99%): Detects duplicate timestamps or repeated sensor transactions.',
      'Consistency (Target: >= 90%): Evaluates cross-field logical coherence (e.g., freezing temperatures should not report zero relative humidity with heavy rain).',
      'Data Quality Warning: If any metric falls below target thresholds, an amber warning banner notifies analysts before running ML training.',
    ],
    tips: [
      'The platform never silently discards records; rejected rows are stored in data/quarantine for auditing.',
    ],
  },
  {
    id: 'map-guide',
    title: 'Urban Intelligence Map Guide',
    category: 'modules',
    icon: '🗺️',
    summary: 'Mastering layers, filters, H3 hexagonal binning, and hotspot drill-down.',
    content: [
      'Layer Controls: Toggle between Traffic Congestion, Safety Hazard Grids, AQI Polygons, and Crash Hotspots.',
      'Empirical Bayes Smoothing: Eliminates the "Small Number Problem" in low-traffic zones, preventing false-positive hazard flags.',
      'DBSCAN Spatial Hotspots: Clusters crash incidents using a 400-meter radius to pinpoint true physical collision intersections.',
      'Interactive Feature Inspection: Click any hexagon cell or hotspot circle to view observed rates, predicted risk, confidence, and recommended interventions.',
      'Canvas Mode: SmartCityAI draws polygons using HTML5 Canvas rather than SVG DOM nodes, guaranteeing 60 FPS performance even with thousands of cells.',
    ],
    tips: [
      'Use the filter bar above the map to isolate specific corridors, risk tiers, or peak hours.',
      'Press keyboard shortcut M to jump directly to the Geospatial Explorer from anywhere.',
    ],
    badge: 'Geospatial',
  },
  {
    id: 'understanding-predictions',
    title: 'Understanding AI Predictions & Uncertainty Intervals',
    category: 'predictions',
    icon: '📉',
    summary: 'How to interpret quantile forecasts, confidence metrics, and prediction intervals.',
    content: [
      'Observed vs Predicted: Observed values are verified empirical historical facts. Predicted values are probabilistic model estimations.',
      'Quantile Intervals [q0.05, q0.95]: Represent a non-parametric 90% confidence envelope. There is an estimated 90% probability that the actual speed or pollutant level will fall within this range.',
      'Conditional Median (q0.50): The central point forecast used for primary dispatch planning.',
      'Interval Width: A wide prediction interval indicates high environmental volatility or model uncertainty; a narrow interval indicates stable patterns.',
      'Congestion Tiers: Severe (< 12 mph), Congested (12-20 mph), Moderate (20-30 mph), Free Flow (> 30 mph).',
    ],
    tips: [
      'Prediction intervals are not guarantees; unexpected events (such as unannounced roadwork) fall outside standard statistical bounds.',
    ],
    badge: 'Machine Learning',
  },
  {
    id: 'ai-solutions-workflow',
    title: 'AI Solutions & Recommendation Review Workflow',
    category: 'solutions',
    icon: '💡',
    summary: 'The human-in-the-loop decision-support lifecycle for municipal actions.',
    content: [
      'Hybrid Generation Architecture: Combines predictive ML outputs, deterministic rule engines, and historical incident evidence.',
      'Priority Scoring: Calculated deterministically from severity (40%), prediction confidence (25%), urgency (20%), and affected corridor exposure (15%).',
      'The Review Lifecycle: Every recommendation begins in NEW status -> Moves to UNDER REVIEW upon assignment -> Transitioned to ACCEPTED, IN PROGRESS, or COMPLETED -> Or marked REJECTED with mandatory reviewer notes.',
      'Audit Logging: Every priority change, review note, and status transition is recorded in the immutable audit trail with user identity and timestamp.',
      'Explicit Advisory Notice: Recommendations are suggestions for qualified human decision-makers. The system does not actuate physical controls.',
    ],
    tips: [
      'Reviewers can downgrade or upgrade priority scores based on local on-ground knowledge.',
    ],
    badge: 'Decision Support',
  },
  {
    id: 'ai-assistant-guide',
    title: 'Using the AI-Powered Urban Analytics Assistant',
    category: 'solutions',
    icon: '🤖',
    summary: 'How to converse with the platform fact retriever with zero hallucination guarantee.',
    content: [
      'Deterministic Query Planning: User questions are parsed into structured intent filters (location, metric, horizon) rather than passed to an ungrounded LLM.',
      'Immutable FactGraph: Answers are constructed exclusively from verified database rows and active model forecasts.',
      'Zero Hallucination Guarantee: If the requested information is absent or insufficient in the database, the assistant explicitly states: "I do not have enough verified platform data to answer this query."',
      'Audit Trail: Every conversation session, query string, retrieved fact list, and generated answer is logged for governance compliance.',
      'Example Queries: "What areas currently have elevated predicted traffic?", "Why is Michigan Avenue flagged as high risk?", "Show active anomalies detected in the last 24 hours."',
    ],
    tips: [
      'Ask specific questions mentioning street corridors or metric names for optimal fact retrieval precision.',
    ],
  },
  {
    id: 'model-performance-metrics',
    title: 'Model Performance & Evaluation Metrics Guide',
    category: 'predictions',
    icon: '🎯',
    summary: 'Demystifying MAE, RMSE, PICP, PSI drift, and cross-validation gates.',
    content: [
      'Mean Absolute Error (MAE): Average magnitude of prediction errors in native units (e.g. mph or AQI points). Less sensitive to extreme outliers.',
      'Root Mean Squared Error (RMSE): Penalizes large forecasting errors more heavily by squaring residuals before averaging.',
      'Prediction Interval Coverage Probability (PICP): Percentage of actual values falling inside the [q0.05, q0.95] envelope. Target is >= 85%.',
      'Population Stability Index (PSI): Measures covariate drift between training baseline and live inference data. PSI < 0.10: Stable; 0.10 to 0.25: Moderate shift; >= 0.25: Critical drift triggering automated retraining.',
      'Chronological Splitting: Models are evaluated strictly on future chronological test sets with no random shuffling to ensure zero data leakage.',
    ],
  },
  {
    id: 'faq-top-questions',
    title: 'Frequently Asked Questions (FAQ)',
    category: 'faq',
    icon: '❓',
    summary: 'Answers to common questions regarding data, predictions, guarantees, and platform behavior.',
    content: [
      'Q: Can SmartCityAI automatically control traffic lights or dispatch emergency fleets?\nA: No. SmartCityAI is an advisory decision-support platform. All recommendations require qualified human authorization.',
      'Q: Are model predictions guaranteed to be 100% accurate?\nA: No. Machine learning models generate probabilistic estimates based on observed historical patterns. 90% prediction intervals provide calibrated bounds rather than absolute certainty.',
      'Q: Can I upload a custom dataset without GPS coordinates?\nA: Yes, for tabular forecasting and statistical analysis. However, spatial mapping and H3 hexagonal binning require valid latitude and longitude fields.',
      'Q: Does the platform track individual citizens or vehicle license plates?\nA: No. The platform strictly enforces spatial aggregation to H3 hexagonal boundaries and anonymizes all public safety records to protect citizen privacy.',
      'Q: What happens if my uploaded dataset contains missing or corrupted values?\nA: The preflight validation gate flags anomalies in the Data Quality Center. Minor gaps are forward-filled up to 2 steps; severely corrupted rows are quarantined without polluting production stores.',
    ],
    badge: 'FAQ',
  },
  {
    id: 'troubleshooting-guide',
    title: 'Platform Troubleshooting & Remediation',
    category: 'troubleshooting',
    icon: '🔧',
    summary: 'Step-by-step diagnostic fixes for common operational issues.',
    content: [
      'Issue: Map appears blank or tiles do not load.\nRemediation: 1. Verify internet connectivity for CartoDB tile CDN. 2. Verify active spatial filters in the top filter bar. 3. Check browser console for WebGL/Canvas warnings.',
      'Issue: Prediction returns HTTP 422 Validation Error.\nRemediation: 1. Ensure current speed is between 0 and 120 mph. 2. Verify horizon is an integer between 1 and 24 hours. 3. Confirm API key header is attached.',
      'Issue: Backend connection failed ("Offline Mock" active).\nRemediation: 1. Confirm FastAPI server is running on port 8000 (python -m uvicorn backend.main:app --port 8000). 2. Click "Live API" toggle in the top-right header.',
      'Issue: AI Assistant returns "Insufficient Data".\nRemediation: 1. Verify telemetry exists for the queried corridor. 2. Ingest recent traffic or accident records to populate the FactGraph.',
    ],
    badge: 'Diagnostics',
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts Reference',
    category: 'shortcuts',
    icon: '⌨️',
    summary: 'Boost operational efficiency with built-in platform hotkeys.',
    content: [
      '? (Shift + /) : Open Global Help Center & Documentation Modal',
      'Esc : Close any open modal, drawer, or tour popover',
      'D : Navigate directly to Executive Dashboard',
      'M : Navigate directly to Geospatial Explorer Map',
      'T : Navigate directly to Traffic Intelligence',
      'S : Navigate directly to Safety & Risk Analytics',
      'A : Open AI Analytics Assistant Chat',
      '/ : Focus global filter and search bar',
    ],
    badge: 'Hotkeys',
  },
];

// -----------------------------------------------------------------------------
// 3. Contextual Tooltips & InfoPopover Definitions
// -----------------------------------------------------------------------------
export const CONTEXTUAL_TOOLTIPS: Record<string, TooltipDefinition> = {
  risk_score: {
    term: 'Risk Score',
    shortDefinition: "Model-derived probability of elevated hazard conditions (0 to 100%).",
    detailedContext: "Computed from historical incident rates, traffic volume exposure, lighting, and ambient weather. It represents statistical likelihood, not an inevitable collision event.",
    epistemicNote: "Probabilistic estimate based on available training telemetry.",
  },
  confidence: {
    term: 'Model Confidence',
    shortDefinition: "Statistical strength supporting the predictive forecast.",
    detailedContext: "Calculated from ensemble leaf variance and prediction interval tightness. Higher confidence indicates lower variance among decision trees.",
    epistemicNote: "Should be interpreted as statistical support, not absolute certainty.",
  },
  prediction_interval: {
    term: '90% Prediction Interval',
    shortDefinition: "Calibrated bounds [q0.05, q0.95] bounding expected values.",
    detailedContext: "Under Pinball Loss optimization, approximately 90% of observed future telemetry values are mathematically expected to fall between the lower and upper bounds.",
    epistemicNote: "Reflects non-parametric uncertainty rather than deterministic prediction.",
  },
  empirical_bayes: {
    term: 'Empirical Bayes Rate',
    shortDefinition: "Variance-stabilized hazard rate adjusting for low exposure.",
    detailedContext: "Shrinks noisy crash rates in low-traffic cells toward the regional metropolitan baseline, eliminating false-positive blackspots caused by small sample sizes.",
  },
  treeshap: {
    term: 'TreeSHAP Attribution',
    shortDefinition: "Local game-theoretic feature contribution to this prediction.",
    detailedContext: "Calculates the exact Shapley value for each feature, showing whether it pushed the prediction higher or lower compared to the city-wide baseline.",
    epistemicNote: "TreeSHAP explains model mechanics; it does not prove causal intervention.",
  },
  psi_drift: {
    term: 'Population Stability Index (PSI)',
    shortDefinition: "Measures statistical distribution shift between baseline and live data.",
    detailedContext: "PSI < 0.10: Negligible change. 0.10 <= PSI < 0.25: Moderate shift requiring monitoring. PSI >= 0.25: Significant drift triggering retrain recommendation.",
  },
  factgraph: {
    term: 'FactGraph Grounding',
    shortDefinition: "Deterministic analytical store preventing LLM numerical hallucination.",
    detailedContext: "The Urban Assistant answers queries strictly using verified platform records and model outputs. It refuses to invent figures when data is unavailable.",
  },
  recommendation_priority: {
    term: 'Recommendation Priority',
    shortDefinition: "Standardized operational urgency rating (Low, Medium, High, Critical).",
    detailedContext: "Determined via transparent formula weighing risk severity (40%), prediction confidence (25%), time urgency (20%), and corridor exposure (15%).",
  },
};
