export function buildSystemArchitecture({ scenarioRepository, dataVault, featureStore, modelRegistry, auditStore, feedbackCount = 0 }) {
  return {
    architecture_id: "FRAUDGUARD_CLOSED_LOOP_V1",
    title: "Closed-loop red-team / blue-team AI system",
    lanes: [
      {
        id: "OFFLINE_NEARLINE",
        label: "Offline / nearline discovery and generation",
        generative_ai_allowed: true,
        stages: [
          { number: 1, id: "THREAT_INTELLIGENCE", label: "Threat intelligence & red team", module: "campaigns.js + agent-lab.js", output: "Versioned attack scenarios" },
          { number: 2, id: "SYNTHETIC_GENERATOR", label: "Synthetic data generator", module: "generator.js", output: "Synthetic transactions" },
          { number: 3, id: "SYNTHETIC_VAULT", label: "Synthetic data vault", module: "data/ + nearline-stores.js", output: "Curated datasets" },
          { number: 4, id: "FEATURE_GRAPH", label: "Feature & graph layer", module: "features.js + twin-engine.js", output: "Feature vectors + graph signals" },
          { number: 5, id: "BLUE_MODELS", label: "Blue-team models", module: "model-adapter.js + model registry", output: "Locked model artifacts" },
          { number: 6, id: "POLICY_DESIGN", label: "Decision policy design", module: "risk-engine.js", output: "Thresholds + reasons" },
          { number: 8, id: "EXTERNAL_SIMULATORS", label: "Payment & issuer simulators", module: "PaymentSystemSimulator", output: "Synthetic transaction outcome" }
        ]
      },
      {
        id: "NEARLINE_PROCESSING",
        label: "Nearline processing and versioned stores",
        stages: [
          { id: "THREAT_REPOSITORY", label: "Threat & scenario repository", status: scenarioRepository.status() },
          { id: "DATA_VAULT", label: "Synthetic data vault", status: dataVault.status() },
          { id: "FEATURE_STORE", label: "Feature store", status: featureStore.status() },
          { id: "MODEL_REGISTRY", label: "Model registry", status: modelRegistry.active() },
          { id: "AUDIT_STORE", label: "Decision logs & audit store", status: auditStore.status() }
        ]
      },
      {
        id: "REAL_TIME_PATH",
        label: "Real-time deterministic path",
        target_latency_ms: 100,
        generative_ai_allowed: false,
        stages: [
          { id: "TRANSACTION_INGESTION", label: "Transaction ingestion", output: "Validated event" },
          { id: "FEATURE_SERVICE", label: "Online feature service", output: "Feature vector" },
          { id: "MODEL_INFERENCE", label: "Model inference service", output: "Risk score + top reasons" },
          { id: "DECISION_ENGINE", label: "Runtime decision engine", output: "ALLOW / STEP_UP / REVIEW / BLOCK" },
          { id: "RESPONSE_SERVICE", label: "Response service", output: "Audited API response" }
        ]
      },
      {
        id: "FEEDBACK_LOOP",
        number: 7,
        label: "Continuous governed learning",
        feedback_records: feedbackCount,
        stages: ["Collect outcomes", "Monitor drift & performance", "Analyze missed patterns", "Generate reviewed scenarios", "Evaluate candidate model on holdout", "Human-gated promotion"]
      }
    ],
    cross_cutting: [
      { id: "API_GATEWAY", status: "HTTP_ADAPTER_ACTIVE", production_target: "AUTHENTICATED_RATE_LIMITED_GATEWAY" },
      { id: "AUTH", status: "NOT_REQUIRED_FOR_LOCAL_SANDBOX", production_target: "OAUTH2_JWT_AND_SERVICE_IDENTITY" },
      { id: "CONFIG", status: "ENV_AND_LOCKED_ARTIFACTS" },
      { id: "OBSERVABILITY", status: "REQUEST_IDS_PIPELINE_TRACES_AND_METRICS" },
      { id: "ALERTING", status: "PROTOTYPE_ONLY", production_target: "DRIFT_THRESHOLD_AND_INCIDENT_ALERTS" },
      { id: "DATA_QUALITY", status: "12_OF_12_FIDELITY_GATES" },
      { id: "CI_CD", status: "GITHUB_ACTIONS_TEST_PIPELINE" },
      { id: "SECRETS", status: "NO_RUNTIME_SECRETS_REQUIRED", production_target: "MANAGED_SECRETS_AND_ROTATION" }
    ],
    principles: [
      "Generative and agentic AI is confined to offline or nearline discovery and simulation.",
      "The real-time authorization path uses a pre-trained locked model and deterministic policy logic.",
      "All artifacts, features, decisions, and feedback are versioned and auditable.",
      "External payment access is simulated; this prototype cannot send or settle a live transaction.",
      "Retraining and promotion require evaluation on a holdout and explicit human approval."
    ]
  };
}
