export const EVIDENCE_STACK = Object.freeze({
  strategy: "HYBRID_EVIDENCE_STACK",
  posture: "Synthetic-first now; public benchmarks for schema and realism checks; authorized institution telemetry only in a governed pilot.",
  layers: [
    {
      id: "twin",
      name: "Payment-network digital twin",
      status: "ACTIVE",
      purpose: "Generate labeled attacks, counterfactual baselines, hard negatives, and repeatable stress tests.",
      data_class: "FICTIONAL_SYNTHETIC",
      contains_pii: false
    },
    {
      id: "public",
      name: "Public benchmark references",
      status: "REFERENCE_ONLY",
      purpose: "Anchor schemas, temporal patterns, class imbalance, and graph motifs without claiming benchmark ingestion.",
      data_class: "PUBLIC_REFERENCE",
      sources: ["Fraud Detection Handbook simulator", "IBM AMLSim / AML-Data"],
      contains_pii: false
    },
    {
      id: "telemetry",
      name: "Authorized institution telemetry",
      status: "PILOT_REQUIRED",
      purpose: "Calibrate distributions, thresholds, drift, and business cost in a controlled shadow-mode deployment.",
      data_class: "RESTRICTED_AGGREGATES",
      contains_pii: "PROHIBITED_IN_LAB"
    }
  ],
  gates: [
    "No raw PAN, credentials, or customer PII",
    "Entity-isolated train, validation, and test splits",
    "Novel attack families remain excluded from training",
    "Human approval before candidate-model promotion",
    "Synthetic metrics are never represented as production performance"
  ]
});
