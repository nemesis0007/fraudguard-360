import test from "node:test";
import assert from "node:assert/strict";
import { FraudGuardPlatform } from "../src/platform.js";

const transaction = {
  transaction_id: "TX_ARCH_1",
  customer_id: "C_ARCH_1",
  merchant_id: "M_ARCH_1",
  device_id: "D_ARCH_1",
  amount: 4200,
  timestamp: "2026-08-22T12:00:00Z",
  currency: "INR",
  country: "IN",
  card_present: false,
  new_payee: true,
  synthetic: true
};

test("real-time path executes explicit deterministic architecture stages", () => {
  const platform = new FraudGuardPlatform();
  const decision = platform.score(transaction);
  assert.deepEqual(decision.pipeline_trace.map((stage) => stage.stage), ["TRANSACTION_INGESTION", "FEATURE_SERVICE", "MODEL_INFERENCE", "DECISION_ENGINE", "RESPONSE_SERVICE"]);
  assert.equal(decision.within_latency_target, true);
  assert.equal(decision.response_target_ms, 100);
  assert.equal(decision.feature_version, "features-1.0");
  assert.equal(decision.policy_version, "decision-policy-1.0");
  assert.equal(platform.featureStore.get(transaction.transaction_id).new_payee, 1);
  assert.equal(platform.recentAudit(1)[0].transaction_id, transaction.transaction_id);
});

test("payment integration is an isolated simulator with no external call", () => {
  const platform = new FraudGuardPlatform();
  const result = platform.authorizeInSimulator({ ...transaction, transaction_id: "TX_ARCH_2" });
  assert.equal(result.simulated_payment.adapter, "ISSUER_AND_PAYMENT_GATEWAY_SIMULATOR");
  assert.equal(result.simulated_payment.external_call_made, false);
  assert.equal(result.simulated_payment.live_payment_access, false);
  assert.match(result.simulated_payment.outcome, /AUTHORIZED|AUTHENTICATION|REVIEW|DECLINED/);
});

test("architecture manifest mirrors offline, nearline, real-time, and feedback lanes", () => {
  const architecture = new FraudGuardPlatform().architectureStatus();
  assert.deepEqual(architecture.lanes.map((lane) => lane.id), ["OFFLINE_NEARLINE", "NEARLINE_PROCESSING", "REAL_TIME_PATH", "FEEDBACK_LOOP"]);
  assert.equal(architecture.lanes[0].stages.length, 7);
  assert.equal(architecture.lanes[2].target_latency_ms, 100);
  assert.equal(architecture.lanes[2].generative_ai_allowed, false);
  assert.ok(architecture.cross_cutting.some((item) => item.id === "DATA_QUALITY"));
  assert.ok(architecture.principles.some((item) => item.includes("cannot send or settle a live transaction")));
});
