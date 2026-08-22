# FraudGuard 360 system architecture

FraudGuard implements the supplied closed-loop red-team / blue-team architecture as a modular monolith with explicit service contracts. The prototype is one dependency-free process, but offline, nearline, real-time, feedback, storage, and external-adapter responsibilities are separated in code and exposed through `/api/v1/architecture`.

The most important boundary is enforced: generative or agentic AI is allowed only in offline/nearline research and synthetic generation. The real-time path uses a locked model artifact and deterministic decision policy.

## End-to-end topology

```text
OFFLINE / NEARLINE

1 Threat intelligence   2 Synthetic generator   3 Synthetic data vault
          |                       |                        |
          +-----------------------+------------------------+
                                  v
4 Feature + graph layer -> 5 Blue-team model registry -> 6 Decision policy design
                                  |                        |
                                  +------------------------+
                                                           v
                                            8 Issuer/payment simulators

NEARLINE STORES

Threat repository -> Synthetic vault -> Feature store <-> Model registry
                                                    \-> Decision audit store

REAL-TIME PATH (<100 ms target)

Transaction ingestion -> Online feature service -> Model inference
        -> Runtime decision engine -> Response service -> Payment simulator
                                               |
                                               v
                                      Append-only audit record

7 GOVERNED FEEDBACK

Outcome -> Drift/performance -> Gap analysis -> Reviewed scenario generation
        -> Holdout evaluation -> Human-approved promotion or rejection
```

## 1. Threat intelligence and red team

`src/campaigns.js`, `src/catalog.js`, and `src/agent-lab.js` provide the versioned threat repository and autonomous research layer. Twenty-four AI-native campaigns are grounded in 22 tested transaction primitives. The local agents can select campaigns and bounded simulation controls only; they cannot access credentials, networks, customer data, or payment rails.

Output: versioned campaign definitions, safe observable kill chains, signal fingerprints, risk labels, and governed mission traces.

## 2. Synthetic data generator

`src/generator.js` materializes seeded fictional transactions with explicit provenance, labels, hard negatives, and monotonic event time. `scripts/export-training-data.js` creates entity-aware splits through the same feature implementation used during inference.

Output: synthetic transaction events.

## 3. Synthetic data vault

`data/` contains the full compressed 210,000-row benchmark, a 4,200-row browsable sample, lineage documentation, and SHA-256 checksums. `SyntheticDataVault` in `src/nearline-stores.js` registers runtime exports. Its current storage is versioned JSONL plus an in-process export registry; object storage is the extraction target.

Output: curated, versioned datasets and quality evidence.

## 4. Feature and graph layer

`src/features.js` calculates eleven training/inference-parity behavioral features. `OnlineFeatureStore` holds current vectors behind an explicit interface. `src/twin-engine.js` adds customer, device, merchant, payee, sequence, and graph-motif signals for the counterfactual arena.

Output: feature vectors and graph signals.

## 5. Blue-team models and registry

`src/model-adapter.js` loads and validates the locked artifact. `ModelRegistry` exposes its version, type, feature contract, holdout, metrics, promotion gate, and rollback mechanism. `ModelInferenceService` produces probability, risk score, and top reason contributions without choosing the final payment action.

Output: model inference and versioned artifact metadata.

## 6. Decision engine

`src/risk-engine.js` separates `infer()` from `decide()`. `RuntimeDecisionEngine` owns the deterministic mapping to `ALLOW`, `STEP_UP`, `REVIEW`, or `BLOCK`. Threshold ordering is validated at startup, transparent rule scoring remains a fallback, and the active model cannot modify policy.

Output: final decision, risk level, reasons, contributions, model version, and policy version.

## Real-time path

`src/realtime-pipeline.js` contains six explicit boundaries:

| Boundary | Responsibility | Output |
| --- | --- | --- |
| `TransactionIngestionService` | Required fields, numeric amount, timestamp, immutable normalized event | Validated event |
| `FeatureService` | Stateful behavioral features and online-store write | Feature vector |
| `ModelInferenceService` | Locked model plus transparent rule inference | Score and top reasons |
| `RuntimeDecisionEngine` | Threshold and policy mapping | Payment decision |
| `ResponseService` | Versioned response and per-stage latency trace | Audited API response |
| `PaymentSystemSimulator` | Issuer/gateway outcome without an external call | Synthetic outcome |

Every `/api/v1/score` response includes `pipeline_trace`, `response_target_ms`, and `within_latency_target`. `/api/v1/payments/simulate` continues into the isolated payment simulator. It always reports `external_call_made: false` and `live_payment_access: false`.

## 7. Governed feedback loop

Outcomes are classified as correct, false positive, or false negative. Misses can produce traceable defensive variants, but the current loop stops before training or promotion. A production promotion workflow must monitor drift, evaluate a signed candidate against entity-aware test and excluded-family holdout sets, require human approval, and preserve rollback.

## 8. External systems boundary

This repository deliberately implements an adapter and simulator, not a real payment connector. `PaymentSystemSimulator` represents issuer, gateway, wallet, core-banking, and card-network outcomes while making no external request. Real integration requires separate authorization, authentication, privacy review, secrets management, idempotency, and shadow-mode controls.

## Nearline stores

| Store | Prototype implementation | Production extraction target |
| --- | --- | --- |
| Threat/scenario repository | Frozen registries | Versioned governed repository |
| Synthetic data vault | JSONL/ZIP artifacts plus runtime export index | S3/MinIO-style object storage |
| Feature store | Bounded in-memory map | Low-latency distributed online/offline store |
| Model registry | Locked JSON artifact adapter | Signed model registry with promotion states |
| Decision audit store | Bounded append-style in-memory records | Append-only PostgreSQL/data lake |

## Cross-cutting infrastructure

- API gateway: versioned routes, shared envelopes, request IDs, payload bounds.
- Authentication: intentionally absent from the local sandbox; OAuth2/JWT and service identity are required before a pilot.
- Configuration: environment thresholds plus locked artifacts.
- Observability: per-stage latency traces, model status, summary metrics, and audit records.
- Alerting: prototype gap; drift, threshold, and incident alerts are required before shadow mode.
- Data quality: 12 committed fidelity checks.
- CI/CD: automated test pipeline and container health check.
- Secrets: none are required by the sandbox; managed storage and rotation are required for external integrations.

## Canonical decision contract

Every real-time response records the transaction ID, feature version, model version, scoring mode, rule score, probability, risk score and level, final policy action, reason codes and contributions, policy version, per-stage latency, total latency, target compliance, synthetic flag, and audit timestamp.

## Migration path

1. Keep the current modular monolith for deterministic challenge demonstrations.
2. Extract the synthetic generator and agent missions into queued nearline workers when batch size requires it.
3. Replace in-memory feature and audit stores with governed persistent services.
4. Deploy ingestion, feature, inference, decision, and response behind an authenticated gateway without changing their contracts.
5. Run the payment adapter in shadow mode with no payment impact.
6. Calibrate on authorized aggregates, add signing/rollback, then consider step-up recommendations before selective blocking.

## Explicit non-goals

- No generative model in the authorization path.
- No live payment rail, customer credential, raw PAN, or customer PII access.
- No automatic retraining or model promotion.
- No production efficacy claim based only on synthetic evidence.
