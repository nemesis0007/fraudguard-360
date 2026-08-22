# Contributing to FraudGuard 360

This repository is a synthetic fraud-defense research system. Changes must preserve reproducibility, explainability, and the boundary against real credentials, customer data, and payment rails.

## Development workflow

1. Create a branch from `main`: `feature/<short-name>`, `fix/<short-name>`, or `docs/<short-name>`.
2. Keep changes inside one architectural boundary where possible.
3. Add or update tests with behavioral changes.
4. Run `npm run check` before opening a pull request.
5. Update the relevant contract or runbook when an API, model artifact, dataset, threshold, or deployment behavior changes.
6. Open a pull request using the repository template and request one teammate review.

## Local setup

```bash
git clone https://github.com/nemesis0007/fraudguard-360.git
cd fraudguard-360
copy .env.example .env
npm start
```

No package installation is required for the current runtime. Node.js 20 or newer is required.

## Required checks

```bash
npm run check
npm run data:fidelity
```

`npm run check` validates the server entry point and runs the complete Node test suite. Run the fidelity audit whenever generator behavior changes.

## Change-specific requirements

| Change | Required evidence |
| --- | --- |
| Attack catalog or campaign | Deterministic generation test, safe observable description, defenses, provenance update |
| Feature | Training/inference parity update, model artifact decision, tests |
| Model | Locked artifact, manifest, entity-aware split metrics, holdout comparison, limitations |
| Decision threshold | Before/after confusion matrix, friction impact, rollback value |
| API | Tests, `docs/API_REFERENCE.md`, backward-compatibility note |
| Dataset | Manifest, row counts, synthetic/PII flags, SHA-256, fidelity audit |
| Deployment | Local verification, production health and architecture endpoint checks |

## Commit and pull-request guidance

- Use an imperative subject: `Add pipeline latency trace`.
- Keep generated datasets out of `data/runtime/`; commit only intentional release/sample artifacts.
- Never commit `.env`, tokens, credentials, raw payment identifiers, customer data, or private benchmark exports.
- Do not combine model promotion with unrelated UI work.
- Document prototype limitations instead of hiding them.

## Review checklist

- Safety boundary is preserved.
- Synthetic results are not presented as production performance.
- Real-time code contains no generative-model call.
- Model and feature versions remain visible.
- Decisions retain reason codes and pipeline latency.
- Tests cover failure and fallback paths.
- Documentation matches the implementation.

See [Engineering Guide](docs/ENGINEERING_GUIDE.md), [API Reference](docs/API_REFERENCE.md), [Operations](docs/OPERATIONS.md), [Architecture](ARCHITECTURE.md), and [Security Policy](SECURITY.md).
