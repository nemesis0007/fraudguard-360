import { ModelAdapter } from "./model-adapter.js";

const REASONS = [
  ["HIGH_VELOCITY", (f) => Math.min(f.velocity_1h / 6, 1), 24],
  ["AMOUNT_DEVIATION", (f) => Math.min(f.amount_deviation / 3, 1), 18],
  ["NEW_DEVICE", (f) => f.new_device, 14],
  ["LOCATION_SHIFT", (f) => f.location_shift, 10],
  ["NEW_PAYEE", (f) => f.new_payee, 12],
  ["CARD_NOT_PRESENT", (f) => f.card_not_present, 7],
  ["SHARED_DEVICE", (f) => Math.min(f.shared_device_count / 3, 1), 12],
  ["UNUSUAL_HOUR", (f) => f.unusual_hour, 5],
  ["NEW_ACCOUNT", (f) => f.new_account, 8],
  ["IDENTITY_MISMATCH", (f) => f.identity_mismatch, 16],
  ["MERCHANT_RISK", (f) => f.merchant_risk, 10]
];

function thresholdFromEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

export class RiskEngine {
  constructor(config = {}) {
    this.thresholds = {
      allow: config.allow ?? thresholdFromEnv("FG_ALLOW_THRESHOLD", 35),
      review: config.review ?? thresholdFromEnv("FG_REVIEW_THRESHOLD", 60),
      block: config.block ?? thresholdFromEnv("FG_BLOCK_THRESHOLD", 80)
    };
    this.model = config.modelAdapter ?? new ModelAdapter(config.modelPath);
    if (!(this.thresholds.allow < this.thresholds.review && this.thresholds.review < this.thresholds.block)) {
      throw new Error("Decision thresholds must be strictly increasing");
    }
  }

  get modelVersion() {
    return this.model.available ? this.model.artifact.model_version : "transparent-baseline-1.0";
  }

  modelHealth() {
    return this.model.health();
  }

  infer(features, { modelAvailable = true } = {}) {
    const contributions = REASONS.map(([code, fn, weight]) => ({
      code,
      points: Math.round(Math.max(0, Math.min(1, fn(features))) * weight)
    })).filter((item) => item.points > 0).sort((a, b) => b.points - a.points);
    const ruleScore = Math.min(100, contributions.reduce((sum, item) => sum + item.points, 0));
    const useModel = modelAvailable && this.model.available;
    const fraudProbability = useModel ? this.model.predict(features) : null;
    const riskScore = useModel
      ? Math.min(100, Math.round(fraudProbability * 70 + ruleScore * 0.3))
      : ruleScore;
    return {
      risk_score: riskScore,
      reason_codes: contributions.slice(0, 4).map((item) => item.code),
      reason_contributions: contributions.slice(0, 4),
      fraud_probability: fraudProbability === null ? null : Number(fraudProbability.toFixed(6)),
      rule_score: ruleScore,
      model_version: this.modelVersion,
      scoring_mode: useModel ? "ENSEMBLE" : "SAFE_FALLBACK"
    };
  }

  decide(inference) {
    const decision = inference.risk_score >= this.thresholds.block ? "BLOCK"
      : inference.risk_score >= this.thresholds.review ? "REVIEW"
        : inference.risk_score >= this.thresholds.allow ? "STEP_UP"
          : "ALLOW";
    return {
      ...inference,
      risk_level: inference.risk_score >= 80 ? "CRITICAL" : inference.risk_score >= 60 ? "HIGH" : inference.risk_score >= 35 ? "MEDIUM" : "LOW",
      decision,
    };
  }

  score(features, options = {}) {
    return this.decide(this.infer(features, options));
  }
}
