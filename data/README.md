# FraudGuard 360 synthetic dataset

The competition provides no dataset. This directory contains the reproducible synthetic dataset used by the committed benchmark, plus a smaller browsable sample.

## Downloads

| Artifact | Rows | Size | Purpose |
| --- | ---: | ---: | --- |
| [`sample/training-dataset.sample.jsonl`](sample/training-dataset.sample.jsonl) | 4,200 | 1.4 MB | Browsable sample: 200 rows for each of 21 training scenarios |
| [`releases/fraudguard-360-synthetic-dataset-210k.zip`](releases/fraudguard-360-synthetic-dataset-210k.zip) | 210,000 | 2.6 MB compressed | Complete benchmark training/validation/test dataset |

The archive contains `training-dataset.jsonl` (69.4 MB uncompressed). The first JSONL record is a metadata manifest; every following record is one labeled feature row.

## Full-dataset composition

- Generator: `synthetic-1.1`
- Seed: `2026`
- Training scenarios: 21 of the 22 governed attack families
- Completely excluded novel-family holdout: `LAUNDER_001`
- Rows: 210,000
- Fraud: 52,753
- Benign: 157,247
- Benign hard negatives: 23,652
- Entity-aware train split: 146,997
- Entity-aware validation split: 20,865
- Entity-aware test split: 42,138
- Privacy: fictional identifiers and synthetic behavior only; no PAN, credentials, or customer PII

## Record schema

```json
{
  "split": "train",
  "scenario_id": "ATO_001",
  "customer_id": "C0003",
  "label": 1,
  "synthetic_profile": "ATTACK",
  "features": {
    "velocity_1h": 1,
    "amount_deviation": 0.389,
    "new_device": 0,
    "shared_device_count": 0,
    "location_shift": 1,
    "new_payee": 0,
    "card_not_present": 0,
    "unusual_hour": 0,
    "new_account": 0,
    "identity_mismatch": 0,
    "merchant_risk": 0.02
  }
}
```

`customer_id` is fictional. The export groups each scenario/customer pair into one split to reduce entity leakage.

## Integrity

```text
full archive SHA-256: 4B1A0508F1D34830BDB221475B60464877516EB7092FC25FEA0160E1175D5320
sample SHA-256:       5E0BD2AE3FB37047AA3B17BFFB2826C5C627B4105504CF1FCC5E18522806D16A
```

## Reproduce it

```bash
npm run data:generate
npm run data:fidelity
```

The generated working copy stays in the ignored `data/runtime/` directory. `src/generator.js` defines the behaviors, and `scripts/export-training-data.js` transforms them with the same `FeatureEngine` used during inference.
