import test from "node:test";
import assert from "node:assert/strict";
import { FraudGuardPlatform } from "../src/platform.js";
import { generateTrainingTransactions } from "../src/generator.js";

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

test("expanded attack catalog covers distinct payment rails and behaviors", () => {
  const platform = new FraudGuardPlatform();
  const catalog = platform.catalog();
  assert.equal(catalog.length, 22);
  assert.equal(new Set(catalog.map((item) => item.family)).size, 22);
  const expected = ["SIMSWAP_001", "TOKEN_001", "QR_001", "BNPL_001", "INVOICE_001", "LOYALTY_001", "SUBSCRIPTION_001", "MERCHANT_001", "NFC_001", "REMIT_001", "PAYROLL_001", "GIFT_001"];
  assert.ok(expected.every((id) => catalog.some((item) => item.id === id)));
  assert.equal(platform.simulate({ scenarioId: "QR_001", volume: 20, seed: 12 }).transactions[0].channel, "QR_PAY");
  assert.equal(platform.simulate({ scenarioId: "BNPL_001", volume: 20, seed: 12 }).transactions[0].channel, "BNPL");
});

test("offline exports scale beyond the guarded live simulation limit", () => {
  const platform = new FraudGuardPlatform();
  const liveDataset = platform.simulate({ scenarioId: "ATO_001", volume: 1200, seed: 91 });
  const trainingDataset = generateTrainingTransactions({ scenarioId: "ATO_001", volume: 1200, seed: 91 });
  assert.equal(liveDataset.rows, 1000);
  assert.equal(trainingDataset.length, 1200);
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
  assert.equal(campaigns.length, 24);
  assert.ok(campaigns.every((item) => item.ai_enabler && item.kill_chain.length === 4));
  assert.ok(campaigns.every((item) => item.novelty >= 80 && item.difficulty >= 80));
  assert.ok(campaigns.every((item) => Object.keys(item.fingerprint).length === 6));
  assert.ok(campaigns.every((item) => item.base_family && item.base_scenario_name && item.severity));
});

test("campaign arena returns agent orchestration and challenge-scale evidence", () => {
  const result = new FraudGuardPlatform().runArena({ campaignId: "AGENT_INTENT_001", volume: 70, seed: 33 });
  assert.equal(result.scenario.codename, "Ghost Cart");
  assert.equal(result.agent_trace.length, 5);
  assert.equal(result.simulation_scale.events_materialized, 70);
  assert.ok(result.simulation_scale.virtual_population > result.simulation_scale.events_materialized);
});

test("local agent lab evolves bounded policies against the payment twin", () => {
  const platform = new FraudGuardPlatform();
  const health = platform.agentHealth();
  assert.equal(health.provider, "LOCAL_POLICY_ENGINE");
  assert.equal(health.external_model_required, false);
  assert.equal(health.agents.length, 6);

  const mission = platform.runAgentMission({
    campaignId: "POLICY_ORACLE_003",
    objective: "GRAPH_EVASION",
    generations: 3,
    volume: 70,
    seed: 2026
  });
  assert.equal(mission.status, "COMPLETE");
  assert.equal(mission.mode, "LOCAL_AUTONOMOUS_SANDBOX");
  assert.equal(mission.evolution.length, 3);
  assert.equal(mission.summary.policies_evaluated, 9);
  assert.equal(mission.summary.synthetic_events_materialized, 630);
  assert.equal(mission.final_arena.scenario.campaign_id, "POLICY_ORACLE_003");
  assert.ok(mission.events.length > 20);
  assert.ok(mission.evolution.every((generation) => generation.candidates.length === 3));
  assert.ok(mission.evolution.every((generation) => generation.candidates.some((candidate) => candidate.candidate_id === generation.winner)));
  assert.equal(mission.governance.network_access, false);
  assert.equal(mission.governance.live_payment_access, false);
  assert.equal(mission.governance.customer_data_access, false);
  assert.equal(mission.governance.audit_log_complete, true);
});
