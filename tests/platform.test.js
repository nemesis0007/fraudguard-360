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

test("digital twin produces deterministic counterfactual rounds and governed receipts", () => {
  const platform = new FraudGuardPlatform();
  const input = { scenarioId: "SYNID_001", volume: 90, seed: 19, aggression: 0.8, stealth: 0.7, graphDefense: true };
  const first = platform.runArena(input);
  const second = new FraudGuardPlatform().runArena(input);
  assert.deepEqual(first.rounds, second.rounds);
  assert.deepEqual(first.graph, second.graph);
  assert.equal(first.rounds.length, 3);
  assert.equal(first.governance.active_model_changed, false);
  assert.ok(first.graph.nodes.length > 0);
  assert.ok(first.decision_receipts.every((item) => Array.isArray(item.reason_codes)));
});

test("hybrid evidence stack labels active, reference, and pilot data truthfully", () => {
  const stack = new FraudGuardPlatform().evidenceStack();
  assert.equal(stack.strategy, "HYBRID_EVIDENCE_STACK");
  assert.deepEqual(stack.layers.map((item) => item.status), ["ACTIVE", "REFERENCE_ONLY", "PILOT_REQUIRED"]);
  assert.equal(stack.layers[0].contains_pii, false);
});

test("AI-native campaign catalog exposes novelty, kill chain, and observable defenses", () => {
  const platform = new FraudGuardPlatform();
  const campaigns = platform.campaigns();
  assert.equal(campaigns.length, 12);
  assert.ok(campaigns.every((item) => item.ai_enabler && item.kill_chain.length === 4));
  assert.ok(campaigns.every((item) => item.novelty >= 80 && item.difficulty >= 80));
  assert.ok(campaigns.every((item) => Object.keys(item.fingerprint).length === 6));
});

test("campaign arena returns agent orchestration and challenge-scale evidence", () => {
  const result = new FraudGuardPlatform().runArena({ campaignId: "AGENT_INTENT_001", volume: 70, seed: 33 });
  assert.equal(result.scenario.codename, "Ghost Cart");
  assert.equal(result.agent_trace.length, 5);
  assert.equal(result.simulation_scale.events_materialized, 70);
  assert.ok(result.simulation_scale.virtual_population > result.simulation_scale.events_materialized);
});
