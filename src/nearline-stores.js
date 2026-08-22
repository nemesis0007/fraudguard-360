export class ThreatScenarioRepository {
  constructor(attacks, campaigns) {
    this.attacks = attacks;
    this.campaigns = campaigns;
    this.version = "threat-registry-1.0";
  }

  status() {
    return { status: "READY", version: this.version, attack_families: this.attacks.length, ai_native_campaigns: this.campaigns.length, storage: "IN_PROCESS_VERSIONED_REGISTRY" };
  }
}

export class SyntheticDataVault {
  constructor(manifest) {
    this.manifest = manifest;
    this.exports = [];
  }

  register(dataset) {
    const record = { dataset_id: dataset.dataset_id, scenario_id: dataset.scenario_id, rows: dataset.rows, provenance: dataset.provenance, registered_at: new Date().toISOString() };
    this.exports.unshift(record);
    this.exports = this.exports.slice(0, 25);
    return record;
  }

  status() {
    return { status: "READY", storage: "VERSIONED_JSONL_ARCHIVE", rows: this.manifest.rows, version: this.manifest.version, contains_pii: this.manifest.contains_pii, recent_exports: this.exports.length };
  }
}

export class OnlineFeatureStore {
  constructor(limit = 5000) {
    this.limit = limit;
    this.records = new Map();
  }

  put(transactionId, features) {
    this.records.set(transactionId, { features, written_at: new Date().toISOString() });
    if (this.records.size > this.limit) this.records.delete(this.records.keys().next().value);
  }

  get(transactionId) {
    return this.records.get(transactionId)?.features ?? null;
  }

  status() {
    return { status: "READY", mode: "IN_MEMORY_PROTOTYPE", records: this.records.size, production_target: "LOW_LATENCY_DISTRIBUTED_FEATURE_STORE" };
  }
}

export class ModelRegistry {
  constructor(riskEngine) {
    this.risk = riskEngine;
  }

  active() {
    return { ...this.risk.modelHealth(), registry_mode: "LOCKED_ARTIFACT", promotion: "HUMAN_GATED", rollback: "ARTIFACT_PINNING" };
  }
}

export class DecisionAuditStore {
  constructor(limit = 1000) {
    this.limit = limit;
    this.records = [];
  }

  append(decision) {
    this.records.unshift(Object.freeze({ ...decision, audited_at: new Date().toISOString() }));
    this.records = this.records.slice(0, this.limit);
  }

  recent(limit = 20) {
    return this.records.slice(0, Math.max(1, Math.min(100, limit)));
  }

  status() {
    return { status: "READY", mode: "IN_MEMORY_PROTOTYPE", immutable_records: this.records.length, production_target: "APPEND_ONLY_POSTGRES_OR_DATA_LAKE" };
  }
}
