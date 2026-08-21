import test from "node:test";
import assert from "node:assert/strict";
import { RiskEngine } from "../src/risk-engine.js";

test("low-risk transactions are allowed", () => {
  const engine = new RiskEngine();
  const result = engine.score({ velocity_1h: 1, amount_deviation: 0.1, new_device: 0, shared_device_count: 0, location_shift: 0, new_payee: 0, card_not_present: 0, unusual_hour: 0, new_account: 0, identity_mismatch: 0, merchant_risk: 0.1 });
  assert.equal(result.decision, "ALLOW");
  assert.ok(result.risk_score < 35);
});

test("high-risk signals produce an explainable block", () => {
  const engine = new RiskEngine();
  const result = engine.score({ velocity_1h: 9, amount_deviation: 4, new_device: 1, shared_device_count: 4, location_shift: 1, new_payee: 1, card_not_present: 1, unusual_hour: 1, new_account: 1, identity_mismatch: 1, merchant_risk: 0.9 });
  assert.equal(result.decision, "BLOCK");
  assert.ok(result.reason_codes.includes("HIGH_VELOCITY"));
  assert.equal(result.risk_level, "CRITICAL");
});

test("invalid threshold order is rejected", () => {
  assert.throws(() => new RiskEngine({ allow: 70, review: 50, block: 80 }), /strictly increasing/);
});

