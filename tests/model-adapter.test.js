import test from "node:test";
import assert from "node:assert/strict";
import { ModelAdapter } from "../src/model-adapter.js";

test("versioned model artifact loads and produces a bounded probability", () => {
  const adapter = new ModelAdapter("models/fraudguard-linear-v1.json");
  assert.equal(adapter.available, true);
  const probability = adapter.predict({
    velocity_1h: 8,
    amount_deviation: 3,
    new_device: 1,
    shared_device_count: 2,
    location_shift: 1,
    new_payee: 1,
    card_not_present: 1,
    unusual_hour: 0,
    new_account: 0,
    identity_mismatch: 0,
    merchant_risk: 0.2
  });
  assert.ok(probability >= 0 && probability <= 1);
  assert.equal(adapter.health().status, "READY");
});

test("missing artifacts fail safely into fallback state", () => {
  const adapter = new ModelAdapter("models/does-not-exist.json");
  assert.equal(adapter.available, false);
  assert.equal(adapter.health().status, "FALLBACK");
});

test("portable XGBoost inference matches Python export parity cases", () => {
  const adapter = new ModelAdapter("models/auralis-xgb-210k-v1.json");
  assert.equal(adapter.available, true);
  assert.equal(adapter.health().model_type, "xgboost_json");
  assert.equal(adapter.health().holdout_metrics.f1, 0.807386);
  for (const sample of adapter.artifact.parity_cases) {
    assert.ok(Math.abs(adapter.predict(sample.features) - sample.probability) < 0.005);
  }
});
