import test from "node:test";
import assert from "node:assert/strict";
import { FraudGuardPlatform } from "../src/platform.js";

test("synthetic generation is deterministic and traceable", () => {
  const platform = new FraudGuardPlatform();
  const a = platform.simulate({ scenarioId: "ATO_001", volume: 25, seed: 7 });
  const b = platform.simulate({ scenarioId: "ATO_001", volume: 25, seed: 7 });
  assert.deepEqual(a.transactions, b.transactions);
  assert.equal(a.rows, 25);
  assert.match(a.provenance, /ATO_001@1.0:seed-7/);
  assert.ok(a.transactions.every((row) => row.synthetic));
  assert.ok(a.transactions.every((row, index) => index === 0 || row.timestamp > a.transactions[index - 1].timestamp));
});

test("synthetic generation includes labeled benign hard negatives", () => {
  const platform = new FraudGuardPlatform();
  const dataset = platform.simulate({ scenarioId: "ATO_001", volume: 300, seed: 77, fraudRate: 0.25 });
  const hardNegatives = dataset.transactions.filter((row) => !row.is_fraud && row.synthetic_profile === "HARD_NEGATIVE");
  assert.ok(hardNegatives.length >= 20);
  assert.ok(hardNegatives.every((row) => row.synthetic === true));
});

test("fidelity report exposes passing quality gates", () => {
  const report = new FraudGuardPlatform().fidelityReport();
  assert.equal(report.status, "PASS");
  assert.equal(report.failed, 0);
  assert.ok(report.passed >= 10);
});

test("evaluation runs a complete red-vs-blue loop", () => {
  const platform = new FraudGuardPlatform();
  const result = platform.evaluate({ scenarioId: "ATO_001", volume: 80, seed: 42, fraudRate: 0.25 });
  const total = Object.values(result.confusion_matrix).reduce((sum, value) => sum + value, 0);
  assert.equal(total, 80);
  assert.ok(result.metrics.f1 >= 0 && result.metrics.f1 <= 1);
  assert.equal(platform.summary().transactions_scored, 80);
});

test("feedback classifies misses as retraining candidates", () => {
  const platform = new FraudGuardPlatform();
  const result = platform.addFeedback({ transaction_id: "TX_1", predicted: "LEGITIMATE", actual: "FRAUD" });
  assert.equal(result.error_type, "FALSE_NEGATIVE");
  assert.equal(result.retrain_candidate, true);
});

test("holdout evaluation compares ensemble against safe fallback", () => {
  const platform = new FraudGuardPlatform();
  const result = platform.evaluateHoldout({ volume: 120, seed: 9001 });
  assert.equal(result.holdout, true);
  assert.equal(result.fallback.scoring_mode, "SAFE_FALLBACK");
  assert.equal(result.ensemble.scoring_mode, "ENSEMBLE");
  assert.equal(typeof result.lift.f1, "number");
});

test("defense-guided mutation creates governed variants from model misses", () => {
  const platform = new FraudGuardPlatform();
  const result = platform.learnFromMisses({ volume: 180, seed: 9001, maxMisses: 4 });
  assert.ok(result.baseline_false_negatives > 0);
  assert.equal(result.variants_generated, result.reviewed_misses_selected * 3);
  assert.equal(result.governance.status, "HUMAN_REVIEW_REQUIRED");
  assert.equal(result.governance.active_model_changed, false);
  assert.ok(result.candidates.every((item) => item.parent_transaction_id && item.mutation_strategy));
});
