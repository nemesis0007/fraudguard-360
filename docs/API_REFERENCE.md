# API reference

Base URL locally: `http://localhost:8080`.

All JSON endpoints return:

```json
{
  "request_id": "uuid-or-x-request-id",
  "status": "success",
  "data": {},
  "error": null
}
```

Errors set `data` to `null` and return `error.code` plus `error.message`.

## Service and architecture

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | Service readiness and model version |
| `GET` | `/api/v1/architecture` | Offline, nearline, real-time, feedback, and cross-cutting topology |
| `GET` | `/api/v1/model/health` | Active artifact, feature version, holdout, and locked metrics |
| `GET` | `/api/v1/evaluation/scorecard` | Artifact-backed model comparison, confusion matrices, attack coverage, and honest evidence gaps |
| `POST` | `/api/v1/model/challenger/predict` | Locked 210k XGBoost feature-vector inference |
| `GET` | `/api/v1/threat-lab/health` | GenAI analyst provider and review-gate status |
| `GET` | `/api/v1/threat-lab/scenarios` | Current in-process review queue |
| `POST` | `/api/v1/threat-lab/discover` | Generate a safe, validated `PENDING_REVIEW` draft |
| `POST` | `/api/v1/threat-lab/scenarios/:id/review` | Human `APPROVE` or `REJECT` decision |
| `POST` | `/api/v1/threat-lab/scenarios/:id/simulate` | Simulate only an `APPROVED` draft |
| `POST` | `/api/v1/threat-lab/from-feedback` | Propose a draft from aggregated false-negative gaps |
| `GET` | `/api/v1/audit/recent?limit=20` | Recent local decision audit records; limit is bounded to 100 |
| `GET` | `/api/v1/metrics/summary` | Runtime totals, latency, model/fidelity health, recent decisions |

## Threat and evidence registries

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/api/v1/attack/catalog` | Twenty-two generator primitives |
| `GET` | `/api/v1/campaign/catalog` | Twenty-four campaign definitions, kill chains, fingerprints, controls |
| `GET` | `/api/v1/challenge/coverage` | Identify/Generate/Defend/Learn proof ledger |
| `GET` | `/api/v1/data/evidence` | Active, reference-only, and pilot-required evidence layers |
| `GET` | `/api/v1/fidelity/report` | Synthetic generator audit and limitations |

## Real-time scoring

`POST /api/v1/score`

Required fields: `transaction_id`, `customer_id`, `merchant_id`, `device_id`, `amount`, and ISO timestamp. Optional feature context includes `country`, `card_present`, `new_payee`, `account_age_days`, `identity_mismatch`, and `merchant_risk`.

```json
{
  "transaction_id": "TX_1001",
  "customer_id": "C_100",
  "merchant_id": "M_50",
  "device_id": "D_9",
  "amount": 8500,
  "timestamp": "2026-08-22T12:30:00Z",
  "country": "IN",
  "card_present": false,
  "new_payee": true,
  "synthetic": true
}
```

The response includes `risk_score`, `risk_level`, `decision`, `reason_codes`, `reason_contributions`, `fraud_probability`, `rule_score`, `model_version`, `feature_version`, `policy_version`, `scoring_mode`, `latency_ms`, `response_target_ms`, `within_latency_target`, and `pipeline_trace`.

Set `model_available: false` to verify the transparent fallback path.

## Payment-system simulation

`POST /api/v1/payments/simulate` accepts the score payload and returns the same decision plus:

```json
{
  "simulated_payment": {
    "adapter": "ISSUER_AND_PAYMENT_GATEWAY_SIMULATOR",
    "external_call_made": false,
    "live_payment_access": false,
    "outcome": "AUTHENTICATION_REQUIRED"
  }
}
```

This route cannot authorize or settle a real payment.

## Simulation and arena

| Method | Route | Required or common input |
| --- | --- | --- |
| `POST` | `/api/v1/simulate` | `scenarioId`; optional `volume`, `seed`, `fraudRate` |
| `POST` | `/api/v1/arena/run` | Optional `campaignId`/`scenarioId`, `volume`, `seed`, `aggression`, `stealth`, `defenderStrength`, `graphDefense` |
| `POST` | `/api/v1/agents/mission` | Optional `campaignId`, `objective`, `generations`, `volume`, bounded controls |
| `GET` | `/api/v1/agents/health` | Local agent roles, objectives, provider, safety boundary |

## Evaluation and learning

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/api/v1/evaluate` | Confusion matrix and metrics for a synthetic scenario |
| `POST` | `/api/v1/evaluate/holdout` | Ensemble vs fallback on excluded-family evidence |
| `POST` | `/api/v1/learn/mutate` | Traceable defensive variants from false negatives; no training or promotion |
| `POST` | `/api/v1/feedback` | Record predicted vs actual outcome |

Feedback requires `transaction_id`, `predicted`, and `actual`.

## Validation and errors

| Code | HTTP status | Meaning |
| --- | ---: | --- |
| `MISSING_FIELDS` | 400 | Required request fields are absent |
| `INVALID_AMOUNT` | 400 | Amount is negative or not numeric |
| `INVALID_TIMESTAMP` | 400 | Timestamp cannot be parsed |
| `INVALID_JSON` | 400 | Malformed JSON body |
| `UNKNOWN_SCENARIO` | 404 | Scenario/campaign cannot be resolved |
| `PAYLOAD_TOO_LARGE` | 413 | JSON body exceeds 1 MB |
| `NOT_FOUND` | 404 | Route does not exist |

The service accepts `x-request-id`; otherwise it generates a UUID and returns it as a response header and envelope field.
