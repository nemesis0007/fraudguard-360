import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { localAgentHealth, runLocalAgentMission } from "./agent-lab.js";
import { ATTACK_CATALOG } from "./catalog.js";
import { CAMPAIGN_CATALOG, CHALLENGE_COVERAGE } from "./campaigns.js";
import { FeatureEngine } from "./features.js";
import { assertSimulationApproved, ThreatReviewRegistry } from "./genai-threat-lab.js";
import { loadFidelityReport } from "./fidelity.js";
import { EVIDENCE_STACK } from "./evidence.js";
import { generateTransactions } from "./generator.js";
import { createDefensiveVariants, mutationBatchId } from "./mutation.js";
import { DecisionAuditStore, ModelRegistry, OnlineFeatureStore, SyntheticDataVault, ThreatScenarioRepository } from "./nearline-stores.js";
import { RealTimeDecisionPipeline } from "./realtime-pipeline.js";
import { RiskEngine } from "./risk-engine.js";
import { buildSystemArchitecture } from "./system-architecture.js";
import { runTwinArena } from "./twin-engine.js";

const DATASET_MANIFEST = JSON.parse(readFileSync(new URL("../data/dataset-manifest.json", import.meta.url), "utf8"));
const LINEAR_BASELINE = JSON.parse(readFileSync(new URL("../models/fraudguard-linear-v1.json", import.meta.url), "utf8"));

function ratio(value, total) {
  return total ? Number((value / total).toFixed(4)) : 0;
}

export class FraudGuardPlatform {
  constructor(options = {}) {
    this.features = new FeatureEngine();
    this.risk = new RiskEngine();
    this.scenarioRepository = new ThreatScenarioRepository(ATTACK_CATALOG, CAMPAIGN_CATALOG);
    this.threatReview = new ThreatReviewRegistry(ATTACK_CATALOG);
    this.dataVault = new SyntheticDataVault(DATASET_MANIFEST);
    this.featureStore = new OnlineFeatureStore();
    this.modelRegistry = new ModelRegistry(this.risk);
    this.auditStore = new DecisionAuditStore();
    this.realtime = new RealTimeDecisionPipeline({ featureEngine: this.features, riskEngine: this.risk, featureStore: this.featureStore, modelRegistry: this.modelRegistry, auditStore: this.auditStore });
    this.fidelity = loadFidelityReport();
    this.feedback = [];
    this.recentDecisions = [];
    this.stats = { scored: 0, blocked: 0, latencyTotal: 0 };
  }

  catalog() {
    return ATTACK_CATALOG;
  }

  campaigns() {
    return CAMPAIGN_CATALOG.map((campaign) => {
      const scenario = ATTACK_CATALOG.find((item) => item.id === campaign.base_scenario_id);
      return {
        ...campaign,
        base_family: scenario?.family ?? "UNKNOWN",
        base_scenario_name: scenario?.name ?? "Unknown scenario",
        severity: scenario?.severity ?? "UNKNOWN"
      };
    });
  }

  challengeCoverage() {
    return CHALLENGE_COVERAGE;
  }

  agentHealth() {
    return localAgentHealth();
  }

  threatLabHealth() { return this.threatReview.health(); }
  threatDrafts() { return this.threatReview.list(); }
  discoverThreat(input = {}) { return this.threatReview.discover(input); }
  reviewThreat(id, input = {}) { return this.threatReview.review(id, input); }
  proposeThreatFromFeedback() { return this.threatReview.proposeFromFeedback(this.feedback); }
  predictFeatureVector(features) {
    const required = this.risk.model.artifact?.feature_order ?? [];
    const missing = required.filter((name) => !Number.isFinite(Number(features?.[name])));
    if (missing.length) throw new Error(`MISSING_MODEL_FEATURES:${missing.join(",")}`);
    const started = performance.now();
    const probability = this.risk.model.predict(features);
    const threshold = Number(this.risk.model.artifact.decision_threshold);
    return { fraud_probability: Number(probability.toFixed(6)), risk_score: Math.round(probability * 100), prediction: probability >= threshold ? "HIGH_RISK" : probability >= threshold * 0.55 ? "MEDIUM_RISK" : "LOW_RISK", model_version: this.risk.modelVersion, provider: "LOCAL_XGBOOST_210K", feature_count: required.length, operating_threshold: threshold, latency_ms: Number((performance.now() - started).toFixed(2)) };
  }

  evaluationScorecard() {
    const health = this.risk.modelHealth();
    const champion = health.test_metrics;
    const holdout = health.holdout_metrics;
    const baseline = LINEAR_BASELINE.metrics?.test;
    const manifest = this.risk.model.artifact?.training_manifest ?? {};
    if (!champion || !holdout || !baseline) throw new Error("EVALUATION_ARTIFACT_INCOMPLETE");
    const metricLift = (current, previous) => Number((current - previous).toFixed(6));
    const trainingScenarios = new Set(manifest.training_scenarios ?? []);
    const holdoutScenarios = new Set(manifest.holdout_scenarios ?? []);
    return {
      generated_from: "LOCKED_LOCAL_ARTIFACTS",
      placeholder: false,
      model_version: health.model_version,
      dataset: {
        rows: manifest.dataset_rows,
        split_strategy: manifest.split_strategy,
        trained_families: trainingScenarios.size,
        excluded_families: holdoutScenarios.size,
        hard_negative_rate: manifest.hard_negative_rate
      },
      comparisons: [
        { id: "LINEAR_BASELINE", label: "Linear baseline", scope: "Mixed-family test", model_version: LINEAR_BASELINE.model_version, metrics: baseline },
        { id: "XGBOOST_CHAMPION", label: "XGBoost champion", scope: "Mixed-family test", model_version: health.model_version, metrics: champion },
        { id: "EXCLUDED_FAMILY", label: "Unseen-family proof", scope: `${this.risk.model.holdout?.holdout_scenario ?? "LAUNDER_001"} completely excluded`, model_version: health.model_version, metrics: holdout }
      ],
      lift_vs_linear: {
        f1: metricLift(champion.f1, baseline.f1),
        recall: metricLift(champion.recall, baseline.recall),
        precision: metricLift(champion.precision, baseline.precision),
        false_positive_rate: metricLift(champion.false_positive_rate, baseline.false_positive_rate)
      },
      attack_coverage: ATTACK_CATALOG.map((scenario) => ({
        scenario_id: scenario.id,
        name: scenario.name,
        family: scenario.family,
        severity: scenario.severity,
        evaluation_role: holdoutScenarios.has(scenario.id) ? "COMPLETELY_EXCLUDED" : trainingScenarios.has(scenario.id) ? "TRAINED" : "SIMULATION_ONLY"
      })),
      evidence_gates: [
        { id: "ENTITY_SPLIT", label: "Entity-disjoint train/test split", status: "VERIFIED", evidence: manifest.split_strategy },
        { id: "FAMILY_HOLDOUT", label: "Completely excluded attack family", status: "VERIFIED", evidence: `${this.risk.model.holdout?.holdout_scenario ?? "LAUNDER_001"} · ${this.risk.model.holdout?.rows ?? 0} rows` },
        { id: "ARTIFACT_PARITY", label: "Python-to-JavaScript model parity", status: "VERIFIED", evidence: `${this.risk.model.artifact?.parity_cases?.length ?? 0} locked probability cases` },
        { id: "HUMAN_GATE", label: "GenAI scenario human approval", status: "VERIFIED", evidence: "Drafts cannot enter simulation before APPROVED" },
        { id: "PRODUCTION_CALIBRATION", label: "Issuer production calibration", status: "OPEN_GAP", evidence: "Synthetic evidence only; pilot labels are required" },
        { id: "TAIL_LATENCY", label: "Independent p99 load benchmark", status: "OPEN_GAP", evidence: "Local inference timing is available; production load evidence is not claimed" }
      ],
      limitations: [
        "All evaluation rows are synthetic and do not represent Mastercard or issuer production traffic.",
        "The excluded-family result measures one held-out family, not guaranteed zero-day performance.",
        "No model retraining or promotion occurs from this scorecard."
      ]
    };
  }

  simulateThreatDraft(id, input = {}) {
    const draft = this.threatReview.get(id);
    assertSimulationApproved(draft);
    const dataset = this.simulate({ scenarioId: draft.candidate.base_scenario_id, volume: input.volume ?? 160, seed: input.seed ?? 2026, fraudRate: input.fraudRate ?? 0.25, signalStrength: input.signalStrength ?? Math.max(0.5, draft.candidate.difficulty_score / 100) });
    return { ...dataset, source_threat_scenario_id: draft.scenario_id, source_threat_scenario_version: draft.scenario_version, provenance: `${dataset.provenance}:approved-draft-${draft.scenario_id}@${draft.scenario_version}`, scenario_metadata: draft.candidate, governance: { reviewed_by: draft.review.reviewer, reviewed_at: draft.review.reviewed_at, synthetic_only: true } };
  }

  runAgentMission(input = {}) {
    const mission = runLocalAgentMission(this.risk, input);
    const adapted = mission.final_arena.rounds.find((round) => round.id === "ADAPTED");
    this.stats.scored += adapted?.metrics.transactions ?? 0;
    this.stats.blocked += adapted?.metrics.attacks_detected ?? 0;
    return mission;
  }

  fidelityReport() {
    return this.fidelity;
  }

  evidenceStack() {
    return EVIDENCE_STACK;
  }

  architectureStatus() {
    return buildSystemArchitecture({ scenarioRepository: this.scenarioRepository, dataVault: this.dataVault, featureStore: this.featureStore, modelRegistry: this.modelRegistry, auditStore: this.auditStore, feedbackCount: this.feedback.length });
  }

  runArena(input = {}) {
    const result = runTwinArena(this.risk, input);
    const adapted = result.rounds.find((round) => round.id === "ADAPTED");
    this.stats.scored += adapted?.metrics.transactions ?? 0;
    this.stats.blocked += adapted?.metrics.attacks_detected ?? 0;
    this.stats.latencyTotal += (adapted?.metrics.transactions ?? 0) * result.outcome.estimated_detection_latency_ms;
    const arenaDecisions = result.decision_receipts.map((decision) => ({
        ...decision,
        feature_version: result.governance.feature_version,
        model_version: result.governance.model_version,
        latency_ms: result.outcome.estimated_detection_latency_ms,
        synthetic: true
      }));
    this.recentDecisions = [
      ...arenaDecisions,
      ...this.recentDecisions
    ].slice(0, 20);
    arenaDecisions.forEach((decision) => this.auditStore.append(decision));
    return result;
  }

  simulate(input) {
    const transactions = generateTransactions(input);
    const dataset = {
      dataset_id: `DS_${randomUUID().slice(0, 8)}`,
      scenario_id: input.scenarioId,
      schema_version: "1.0",
      rows: transactions.length,
      fraud_rows: transactions.filter((row) => row.is_fraud).length,
      provenance: `${input.scenarioId}@1.0:seed-${input.seed ?? 42}`,
      transactions
    };
    this.dataVault.register(dataset);
    return dataset;
  }

  score(transaction, options = {}) {
    const decision = this.realtime.execute(transaction, options);
    this.stats.scored += 1;
    this.stats.blocked += decision.decision === "BLOCK" ? 1 : 0;
    this.stats.latencyTotal += decision.latency_ms;
    this.recentDecisions.unshift(decision);
    this.recentDecisions = this.recentDecisions.slice(0, 20);
    return decision;
  }

  authorizeInSimulator(transaction, options = {}) {
    const decision = this.realtime.authorizeInSimulator(transaction, options);
    this.stats.scored += 1;
    this.stats.blocked += decision.decision === "BLOCK" ? 1 : 0;
    this.stats.latencyTotal += decision.latency_ms;
    this.recentDecisions.unshift(decision);
    this.recentDecisions = this.recentDecisions.slice(0, 20);
    return decision;
  }

  recentAudit(limit = 20) {
    return this.auditStore.recent(limit);
  }

  evaluate(input, options = {}) {
    this.features.reset();
    const dataset = this.simulate(input);
    let tp = 0; let fp = 0; let tn = 0; let fn = 0;
    const scores = dataset.transactions.map((transaction) => {
      const decision = this.score(transaction, { modelAvailable: options.modelAvailable !== false });
      // Any defensive intervention counts as a detected risk event. STEP_UP is
      // deliberately included: in a payment flow it is a fraud-control action,
      // even when the transaction is not blocked or sent to manual review.
      const predictedFraud = decision.decision !== "ALLOW";
      if (predictedFraud && transaction.is_fraud) tp += 1;
      else if (predictedFraud) fp += 1;
      else if (transaction.is_fraud) fn += 1;
      else tn += 1;
      return decision.risk_score;
    });
    const precision = ratio(tp, tp + fp);
    const recall = ratio(tp, tp + fn);
    return {
      evaluation_id: `EV_${randomUUID().slice(0, 8)}`,
      scenario_id: input.scenarioId,
      model_version: this.risk.modelVersion,
      confusion_matrix: { tp, fp, tn, fn },
      metrics: {
        precision,
        recall,
        f1: precision + recall ? Number((2 * precision * recall / (precision + recall)).toFixed(4)) : 0,
        false_positive_rate: ratio(fp, fp + tn),
        average_risk_score: Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
      },
      scoring_mode: options.modelAvailable === false ? "SAFE_FALLBACK" : this.risk.modelHealth().status === "READY" ? "ENSEMBLE" : "SAFE_FALLBACK",
      limitations: ["Synthetic evaluation only; results are not production claims."]
    };
  }

  evaluateHoldout(input = {}) {
    const scenarioId = input.scenarioId ?? this.risk.modelHealth().holdout_scenarios?.[0] ?? "LAUNDER_001";
    const request = { scenarioId, volume: input.volume ?? 500, seed: input.seed ?? 9001, fraudRate: input.fraudRate ?? 0.25 };
    const fallback = this.evaluate(request, { modelAvailable: false });
    const ensemble = this.evaluate(request, { modelAvailable: true });
    return {
      scenario_id: scenarioId,
      holdout: this.risk.modelHealth().holdout_scenarios?.includes(scenarioId) ?? false,
      fallback,
      ensemble,
      lift: {
        f1: Number((ensemble.metrics.f1 - fallback.metrics.f1).toFixed(4)),
        recall: Number((ensemble.metrics.recall - fallback.metrics.recall).toFixed(4)),
        false_positive_rate: Number((ensemble.metrics.false_positive_rate - fallback.metrics.false_positive_rate).toFixed(4))
      }
    };
  }

  learnFromMisses(input = {}) {
    const scenarioId = input.scenarioId ?? this.risk.modelHealth().holdout_scenarios?.[0] ?? "LAUNDER_001";
    const request = { scenarioId, volume: input.volume ?? 500, seed: input.seed ?? 9001, fraudRate: input.fraudRate ?? 0.25 };
    const transactions = generateTransactions(request);
    const baselineEngine = new FeatureEngine();
    const misses = [];
    for (const [index, transaction] of transactions.entries()) {
      const decision = this.risk.score(baselineEngine.transform(transaction));
      if (transaction.is_fraud && decision.decision === "ALLOW") misses.push({ index, transaction, decision });
    }

    const selected = misses.slice(0, Math.max(1, Math.min(12, Number(input.maxMisses) || 8)));
    const candidates = [];
    for (const [missIndex, miss] of selected.entries()) {
      const variants = createDefensiveVariants(miss.transaction, { seed: request.seed + missIndex * 31, count: 3 });
      for (const variant of variants) {
        const contextEngine = new FeatureEngine();
        for (let index = 0; index < miss.index; index += 1) contextEngine.transform(transactions[index]);
        const result = this.risk.score(contextEngine.transform(variant));
        candidates.push({
          transaction_id: variant.transaction_id,
          parent_transaction_id: variant.parent_transaction_id,
          mutation_strategy: variant.mutation_strategy,
          risk_score: result.risk_score,
          decision: result.decision,
          detected: result.decision !== "ALLOW",
          reason_codes: result.reason_codes
        });
      }
    }
    const detected = candidates.filter((item) => item.detected).length;
    const payload = { scenarioId, seed: request.seed, parent_ids: selected.map((item) => item.transaction.transaction_id), candidates };
    return {
      mutation_batch_id: mutationBatchId(payload),
      scenario_id: scenarioId,
      source_model_version: this.risk.modelVersion,
      baseline_rows: transactions.length,
      baseline_false_negatives: misses.length,
      reviewed_misses_selected: selected.length,
      variants_generated: candidates.length,
      variants_detected: detected,
      variant_detection_rate: ratio(detected, candidates.length),
      candidates,
      governance: {
        status: "HUMAN_REVIEW_REQUIRED",
        active_model_changed: false,
        candidate_artifact_created: false,
        promotion_allowed: false
      },
      limitations: [
        "Variants adjust defensive simulation attributes only and remain synthetic.",
        "This step proposes stress cases; it does not retrain or promote the active model."
      ]
    };
  }

  addFeedback(input) {
    const item = {
      feedback_id: `FB_${randomUUID().slice(0, 8)}`,
      transaction_id: input.transaction_id,
      predicted: input.predicted,
      actual: input.actual,
      scenario_id: input.scenario_id ?? null,
      error_type: input.predicted === input.actual ? "CORRECT" : input.predicted === "FRAUD" ? "FALSE_POSITIVE" : "FALSE_NEGATIVE",
      retrain_candidate: input.predicted !== input.actual,
      created_at: new Date().toISOString()
    };
    this.feedback.unshift(item);
    return item;
  }

  summary() {
    return {
      attack_families: ATTACK_CATALOG.length,
      model: this.risk.modelHealth(),
      fidelity: {
        status: this.fidelity.status,
        report_version: this.fidelity.report_version,
        quality_score: this.fidelity.quality_score,
        checks_passed: this.fidelity.passed,
        checks_failed: this.fidelity.failed
      },
      transactions_scored: this.stats.scored,
      blocked: this.stats.blocked,
      average_latency_ms: this.stats.scored ? Number((this.stats.latencyTotal / this.stats.scored).toFixed(2)) : 0,
      retraining_candidates: this.feedback.filter((item) => item.retrain_candidate).length,
      threat_lab: this.threatReview.health(),
      recent_decisions: this.recentDecisions,
      feedback: this.feedback.slice(0, 10)
    };
  }
}
