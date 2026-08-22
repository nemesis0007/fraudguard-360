import { performance } from "node:perf_hooks";

function elapsed(started) {
  return Number((performance.now() - started).toFixed(3));
}

export class TransactionIngestionService {
  ingest(transaction) {
    const required = ["transaction_id", "customer_id", "merchant_id", "device_id", "amount", "timestamp"];
    const missing = required.filter((field) => transaction[field] === undefined || transaction[field] === null || transaction[field] === "");
    if (missing.length) throw new Error(`MISSING_FIELDS:${missing.join(",")}`);
    if (!Number.isFinite(Number(transaction.amount)) || Number(transaction.amount) < 0) throw new Error("INVALID_AMOUNT");
    if (Number.isNaN(Date.parse(transaction.timestamp))) throw new Error("INVALID_TIMESTAMP");
    return Object.freeze({ ...transaction, amount: Number(transaction.amount), ingested_at: new Date().toISOString() });
  }
}

export class FeatureService {
  constructor(featureEngine, featureStore) {
    this.engine = featureEngine;
    this.store = featureStore;
  }

  compute(transaction) {
    const features = this.engine.transform(transaction);
    this.store.put(transaction.transaction_id, features);
    return features;
  }
}

export class ModelInferenceService {
  constructor(riskEngine, modelRegistry) {
    this.risk = riskEngine;
    this.registry = modelRegistry;
  }

  predict(features, options = {}) {
    return { ...this.risk.infer(features, options), registry: this.registry.active().registry_mode };
  }
}

export class RuntimeDecisionEngine {
  constructor(riskEngine) {
    this.risk = riskEngine;
  }

  decide(inference) {
    const { registry, ...risk } = inference;
    return { ...this.risk.decide(risk), policy_version: "decision-policy-1.0", model_registry: registry };
  }
}

export class ResponseService {
  respond(transaction, decision, trace) {
    return {
      transaction_id: transaction.transaction_id,
      ...decision,
      feature_version: "features-1.0",
      latency_ms: Number(trace.reduce((sum, stage) => sum + stage.latency_ms, 0).toFixed(3)),
      pipeline_trace: trace,
      response_target_ms: 100,
      within_latency_target: trace.reduce((sum, stage) => sum + stage.latency_ms, 0) < 100,
      synthetic: transaction.synthetic === true
    };
  }
}

export class PaymentSystemSimulator {
  settle(decision) {
    return {
      adapter: "ISSUER_AND_PAYMENT_GATEWAY_SIMULATOR",
      external_call_made: false,
      live_payment_access: false,
      outcome: decision.decision === "BLOCK" ? "DECLINED" : decision.decision === "REVIEW" ? "HELD_FOR_REVIEW" : decision.decision === "STEP_UP" ? "AUTHENTICATION_REQUIRED" : "AUTHORIZED_IN_SIMULATOR"
    };
  }
}

export class RealTimeDecisionPipeline {
  constructor({ featureEngine, riskEngine, featureStore, modelRegistry, auditStore }) {
    this.ingestion = new TransactionIngestionService();
    this.features = new FeatureService(featureEngine, featureStore);
    this.inference = new ModelInferenceService(riskEngine, modelRegistry);
    this.decision = new RuntimeDecisionEngine(riskEngine);
    this.response = new ResponseService();
    this.paymentSimulator = new PaymentSystemSimulator();
    this.audit = auditStore;
  }

  execute(transaction, options = {}) {
    const trace = [];
    let started = performance.now();
    const ingested = this.ingestion.ingest(transaction);
    trace.push({ stage: "TRANSACTION_INGESTION", latency_ms: elapsed(started), output: "VALIDATED_EVENT" });
    started = performance.now();
    const features = this.features.compute(ingested);
    trace.push({ stage: "FEATURE_SERVICE", latency_ms: elapsed(started), output: "FEATURE_VECTOR" });
    started = performance.now();
    const inference = this.inference.predict(features, options);
    trace.push({ stage: "MODEL_INFERENCE", latency_ms: elapsed(started), output: "RISK_SCORE_AND_REASONS" });
    started = performance.now();
    const decision = this.decision.decide(inference);
    trace.push({ stage: "DECISION_ENGINE", latency_ms: elapsed(started), output: decision.decision });
    started = performance.now();
    const result = this.response.respond(ingested, decision, trace);
    trace.push({ stage: "RESPONSE_SERVICE", latency_ms: elapsed(started), output: "API_RESPONSE" });
    result.latency_ms = Number(trace.reduce((sum, stage) => sum + stage.latency_ms, 0).toFixed(3));
    result.within_latency_target = result.latency_ms < result.response_target_ms;
    this.audit.append(result);
    return result;
  }

  authorizeInSimulator(transaction, options = {}) {
    const decision = this.execute({ ...transaction, synthetic: true }, options);
    return { ...decision, simulated_payment: this.paymentSimulator.settle(decision) };
  }
}
