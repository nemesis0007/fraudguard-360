# FraudGuard 360 Architecture

## MVP shape

```text
Threat catalog -> Synthetic generator -> Feature engine -> Risk engine -> Policy decision
      ^                                                           |
      |                                                           v
      +---------- reviewed feedback / defense-guided mutation <---+
```

The real-time path is deterministic and contains no generative model. Scenario discovery, mutation, training, and evaluation are offline or nearline activities.

## Module boundaries

| Module | Responsibility | Extraction trigger |
| --- | --- | --- |
| `catalog.js` | Approved scenario registry and safe signals | Multiple researchers need write access or provenance persistence |
| `generator.js` | Seeded synthetic transaction generation | Large batches need workers/object storage |
| `features.js` | Training/inference-parity feature logic | Shared low-latency state requires Redis/feature store |
| `model-adapter.js` / `risk-engine.js` | Locked model inference, rule ensemble, and deterministic thresholds | Python model serving or independent scaling becomes necessary |
| `platform.js` | Closed-loop orchestration, evaluation, feedback | Durable jobs and queues are introduced |
| `http.js` | Versioned transport, validation, response envelope | API gateway/auth is required |
| `public/` | Judge-facing command center | Product UI needs an independent release cadence |

## Canonical contracts

The current schema is intentionally small. Every production-bound transaction contract should add schema validation and explicit version migration before introducing additional services.

Every scored decision records:

- transaction ID;
- risk score and level;
- final policy decision;
- human-readable reason codes and contributions;
- model version and feature version;
- scoring mode and latency;
- synthetic-data flag.

## Model adapter

The transparent baseline remains a deterministic benchmark and resilience fallback. The offline Python trainer exports a locked JSON artifact containing feature order, normalization values, coefficients, threshold, scenario manifest, split sizes, metrics, limitations, and a content-derived model version. The Node hot path validates and loads that artifact at startup; the deterministic policy layer remains the final authority.

The current linear artifact is intentionally dependency-light. LightGBM or XGBoost can later replace it behind the same adapter after the benchmark dataset is frozen. A missing or invalid artifact never prevents scoring: the system reports `FALLBACK` health and uses rule scoring.

## Evaluation discipline

- Customer entities do not cross train, validation, and test splits within a scenario.
- `LAUNDER_001` is excluded from training and used as the current novel-family holdout.
- The dashboard compares ensemble and safe-fallback behavior on that holdout.
- Synthetic metrics are labeled as prototype evidence, never production claims.

## Production feasibility path

1. **Offline simulation:** measure attack diversity, fidelity, model lift, and false positives.
2. **Shadow mode:** score live-like authorized traffic without affecting decisions.
3. **Step-up recommendation:** restrict medium risk to extra authentication or review.
4. **Selective blocking:** block only calibrated, high-confidence patterns with rollback.
5. **Continuous hardening:** reviewed scenario generation, scheduled retraining, governance approval, and immutable audit history.

## Explicit non-goals

- No real payment rails, real credentials, or customer PII.
- No uncontrolled model self-update.
- No generative model in the authorization path.
- No production claims based only on synthetic offline metrics.
