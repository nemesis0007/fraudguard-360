import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { ATTACK_CATALOG } from "./catalog.js";
import { FeatureEngine } from "./features.js";
import { loadFidelityReport } from "./fidelity.js";
import { EVIDENCE_STACK } from "./evidence.js";
import { generateTransactions } from "./generator.js";
import { createDefensiveVariants, mutationBatchId } from "./mutation.js";
import { RiskEngine } from "./risk-engine.js";
import { runTwinArena } from "./twin-engine.js";

function ratio(value, total) {
  return total ? Number((value / total).toFixed(4)) : 0;
}

export class FraudGuardPlatform {
  constructor() {
    this.features = new FeatureEngine();
    this.risk = new RiskEngine();
    this.fidelity = loadFidelityReport();
    this.feedback = [];
    this.recentDecisions = [];
    this.stats = { scored: 0, blocked: 0, latencyTotal: 0 };
  }

  catalog() {
    return ATTACK_CATALOG;
  }

  fidelityReport() {
    return this.fidelity;
  }

  evidenceStack() {
    return EVIDENCE_STACK;
  }

  runArena(input = {}) {
    const result = runTwinArena(this.risk, input);
    const adapted = result.rounds.find((round) => round.id === "ADAPTED");
    this.stats.scored += adapted?.metrics.transactions ?? 0;
    this.stats.blocked += adapted?.metrics.attacks_detected ?? 0;
    this.stats.latencyTotal += (adapted?.metrics.transactions ?? 0) * result.outcome.estimated_detection_latency_ms;
    this.recentDecisions = [
      ...result.decision_receipts.map((decision) => ({
        ...decision,
        feature_version: result.governance.feature_version,
        model_version: result.governance.model_version,
        latency_ms: result.outcome.estimated_detection_latency_ms,
        synthetic: true
      })),
      ...this.recentDecisions
    ].slice(0, 20);
    return result;
  }

  simulate(input) {
    const transactions = generateTransactions(input);
    return {
      dataset_id: `DS_${randomUUID().slice(0, 8)}`,
      scenario_id: input.scenarioId,
      schema_version: "1.0",
      rows: transactions.length,
      fraud_rows: transactions.filter((row) => row.is_fraud).length,
      provenance: `${input.scenarioId}@1.0:seed-${input.seed ?? 42}`,
      transactions
    };
  }

  score(transaction, options = {}) {
    const started = performance.now();
    const features = this.features.transform(transaction);
    const result = this.risk.score(features, options);
    const latency = Number((performance.now() - started).toFixed(2));
    const decision = {
      transaction_id: transaction.transaction_id,
      ...result,
      feature_version: "features-1.0",
      latency_ms: latency,
      synthetic: transaction.synthetic === true
    };
    this.stats.scored += 1;
    this.stats.blocked += decision.decision === "BLOCK" ? 1 : 0;
    this.stats.latencyTotal += latency;
    this.recentDecisions.unshift(decision);
    this.recentDecisions = this.recentDecisions.slice(0, 20);
    return decision;
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
      recent_decisions: this.recentDecisions,
      feedback: this.feedback.slice(0, 10)
    };
  }
}
