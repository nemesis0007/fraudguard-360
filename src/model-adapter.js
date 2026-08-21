import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function sigmoid(value) {
  const bounded = Math.max(-35, Math.min(35, value));
  return 1 / (1 + Math.exp(-bounded));
}

export class ModelAdapter {
  constructor(modelPath = process.env.FG_MODEL_PATH ?? "models/fraudguard-linear-v1.json") {
    this.path = modelPath ? resolve(modelPath) : null;
    this.artifact = null;
    this.error = null;
    if (!this.path || !existsSync(this.path)) {
      this.error = "MODEL_ARTIFACT_NOT_FOUND";
      return;
    }
    try {
      const artifact = JSON.parse(readFileSync(this.path, "utf8"));
      const size = artifact.feature_order?.length ?? 0;
      if (!size || artifact.weights?.length !== size || artifact.normalization?.means?.length !== size || artifact.normalization?.scales?.length !== size) {
        throw new Error("INVALID_MODEL_ARTIFACT");
      }
      this.artifact = artifact;
    } catch (error) {
      this.error = error.message;
    }
  }

  get available() { return this.artifact !== null; }

  predict(features) {
    if (!this.artifact) throw new Error(this.error ?? "MODEL_UNAVAILABLE");
    const { feature_order: order, normalization, weights, bias } = this.artifact;
    let logit = Number(bias);
    for (let index = 0; index < order.length; index += 1) {
      const raw = Number(features[order[index]] ?? 0);
      const normalized = (raw - normalization.means[index]) / normalization.scales[index];
      logit += normalized * weights[index];
    }
    return sigmoid(logit);
  }

  health() {
    return this.available ? {
      status: "READY",
      model_version: this.artifact.model_version,
      model_type: this.artifact.model_type,
      feature_version: this.artifact.feature_version,
      decision_threshold: this.artifact.decision_threshold,
      holdout_scenarios: this.artifact.training_manifest?.holdout_scenarios ?? [],
      test_metrics: this.artifact.metrics?.test ?? null
    } : { status: "FALLBACK", model_version: "transparent-baseline-1.0", reason: this.error };
  }
}

