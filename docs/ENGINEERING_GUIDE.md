# Engineering guide

## System purpose

FraudGuard 360 is a closed-loop synthetic payment-fraud laboratory. It identifies AI-enabled campaigns, generates reproducible transactions and entity graphs, evaluates a locked model plus deterministic policy, records explainable decisions, and converts reviewed misses into future stress cases.

It is not a payment processor. All identifiers, transactions, authorization outcomes, and graphs are fictional.

## Quick start

Requirements: Node.js 20+; Python 3.11+ only for rebuilding the model.

```bash
copy .env.example .env
npm start
```

Open `http://localhost:8080`. Run verification with:

```bash
npm run check
```

## Repository map

| Path | Responsibility |
| --- | --- |
| `src/catalog.js` | Twenty-two governed generator primitives |
| `src/campaigns.js` | Twenty-four AI-native campaign definitions and challenge coverage |
| `src/agent-lab.js` | Six-role bounded local policy search |
| `src/generator.js` | Seeded transaction and hard-negative generation |
| `src/twin-engine.js` | Counterfactual worlds, graph motifs, adaptive rounds |
| `src/features.js` | Stateful training/inference-parity features |
| `src/model-adapter.js` | Locked artifact loading, validation, normalized prediction |
| `src/risk-engine.js` | Explainable inference and deterministic decision thresholds |
| `src/realtime-pipeline.js` | Ingestion → features → inference → decision → response |
| `src/nearline-stores.js` | Repository, vault, feature, model, and audit interfaces |
| `src/system-architecture.js` | Machine-readable architecture manifest |
| `src/platform.js` | Application orchestration and feedback loop |
| `src/http.js` | HTTP transport, validation, envelopes, static assets |
| `api/index.js` | Serverless deployment adapter |
| `models/` | Locked model and fidelity artifacts |
| `data/` | Released dataset, sample, manifest, lineage, checksums |
| `public/` | Engineering workspace UI |
| `tests/` | Unit, integration, API, architecture, and dataset integrity tests |

## Real-time request lifecycle

`POST /api/v1/score` executes five deterministic stages:

1. `TransactionIngestionService` validates and normalizes the event.
2. `FeatureService` calculates behavioral features and writes the online feature store.
3. `ModelInferenceService` loads the active registry entry and returns model/rule evidence.
4. `RuntimeDecisionEngine` applies configured thresholds to return `ALLOW`, `STEP_UP`, `REVIEW`, or `BLOCK`.
5. `ResponseService` adds versions, reason codes, and per-stage latency.

The result is appended to `DecisionAuditStore`. `POST /api/v1/payments/simulate` uses the same path and then produces a fictional issuer/gateway outcome without an external call.

## State and lifecycle

The current stores are bounded in-process prototypes. A local server keeps state until restart. A serverless deployment may reuse warm state but must not be treated as durable. Production extraction targets are documented in `ARCHITECTURE.md`.

Stateful feature behavior is intentional. Tests construct fresh platform instances when isolation matters. Call `FeatureEngine.reset()` before an independent evaluation batch.

## Dataset workflow

The committed full dataset contains 210,000 feature rows across 21 training scenarios. `LAUNDER_001` is completely excluded as a novel-family holdout.

```bash
npm run data:generate
npm run data:fidelity
```

The working export is written under ignored `data/runtime/`. If publishing a release artifact, update `data/dataset-manifest.json`, checksums, `data/README.md`, and the dataset integrity test together.

## Model workflow

```bash
python -m pip install -r ml/requirements.txt
npm run data:generate
npm run data:fidelity
python ml/train.py
npm run check
```

The trainer must preserve entity-aware splits and the excluded-family holdout. Never overwrite an active artifact without recording its metrics, limitations, feature order, normalization, and version.

## Adding an attack primitive

1. Add a safe high-level scenario to `src/catalog.js`.
2. Define generator behavior without operational fraud instructions.
3. Add deterministic and channel-coverage tests.
4. Decide whether it is training or holdout evidence.
5. Regenerate the dataset, fidelity report, and model if the training registry changed.

## Adding an AI-native campaign

Add an entry to `src/campaigns.js` with an AI enabler, base scenario, channels, graph motif, novelty/difficulty, six-domain fingerprint, four observable stages, and expected controls. Campaign definitions describe defensive observables, not victim selection or credential acquisition.

## Further references

- [API Reference](API_REFERENCE.md)
- [Operations](OPERATIONS.md)
- [Architecture](../ARCHITECTURE.md)
- [Dataset card](../data/README.md)
- [Contributing](../CONTRIBUTING.md)
