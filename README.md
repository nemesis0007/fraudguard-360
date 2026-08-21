# FraudGuard 360

FraudGuard 360 is a privacy-safe red-team / blue-team fraud-defense lab for the Mastercard GFF 2026 challenge. It turns structured attack scenarios into synthetic transactions, replays them through a real-time risk path, explains each decision, and sends errors into a controlled learning queue.

> Prototype boundary: this repository uses synthetic data only. It does not connect to real credentials, customer data, or payment authorization systems, and it does not provide instructions for committing fraud.

This competition does not provide a dataset. FraudGuard deliberately creates a versioned synthetic payment dataset so the same attack scenarios can train and stress-test the defense. The project is aligned to the five judging dimensions: attack diversity, simulation fidelity, detection efficacy, novelty, and real-world feasibility.

## What is working now

- 10 versioned attack families across account takeover, CNP, mule networks, bots, refund abuse, instant-payment scams, synthetic identity, layering, promotion abuse, and friendly fraud.
- Deterministic seeded transaction generation with monotonic event time, provenance, synthetic-data flags, and controlled hard negatives.
- A committed synthetic-fidelity report with 12 automated gates covering reproducibility, schema, class balance, overlap, correlation, feature ranges, and privacy.
- Stateful velocity, amount, device, graph-proxy, account, merchant, payee, and geography features.
- A trained NumPy logistic model blended with explainable rule signals, with a locked JSON artifact and feature manifest.
- Configurable `ALLOW`, `STEP_UP`, `REVIEW`, and `BLOCK` thresholds plus safe transparent fallback when the artifact is unavailable.
- Customer-entity train/validation/test splits and a completely excluded attack-family holdout.
- Red-vs-blue evaluation with precision, recall, F1, false-positive rate, and a confusion matrix.
- Feedback classification and a controlled retraining-candidate queue.
- Defense-guided mutation that turns actual false negatives into traceable stress variants under an explicit human-review gate.
- Responsive command-center dashboard and shared versioned API envelope.
- Zero runtime dependencies, Node tests, Docker image, Compose health check, and GitHub Actions CI.

## Run it

Requires Node.js 20 or newer.

```bash
npm start
```

Open [http://localhost:8080](http://localhost:8080). No `npm install` is required for the current vertical slice.

The dashboard includes a detailed [How it works](http://localhost:8080/guide.html) walkthrough. The repository-level explanation is in [docs/IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md).

Run the test suite:

```bash
npm test
```

Or run in Docker:

```bash
docker compose up --build
```

## API

All JSON responses use a shared envelope with `request_id`, `status`, `data`, and `error`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service and model health |
| `GET` | `/api/v1/attack/catalog` | Structured attack catalog |
| `POST` | `/api/v1/simulate` | Generate a traceable synthetic dataset |
| `POST` | `/api/v1/score` | Score a live-style transaction |
| `POST` | `/api/v1/evaluate` | Run a red-vs-blue evaluation |
| `POST` | `/api/v1/evaluate/holdout` | Compare the ensemble and fallback on an excluded attack family |
| `POST` | `/api/v1/learn/mutate` | Generate reviewed defensive variants from false negatives without retraining or promotion |
| `POST` | `/api/v1/feedback` | Record predicted vs actual outcome |
| `GET` | `/api/v1/model/health` | Locked model manifest, feature version, holdout, and test metrics |
| `GET` | `/api/v1/fidelity/report` | Synthetic generator quality gates, diagnostics, and limitations |
| `GET` | `/api/v1/metrics/summary` | Dashboard metrics and recent decisions |

Example evaluation:

```bash
curl -X POST http://localhost:8080/api/v1/evaluate \
  -H "content-type: application/json" \
  -d '{"scenarioId":"ATO_001","volume":160,"seed":42,"fraudRate":0.25}'
```

Example score request:

```json
{
  "transaction_id": "TX1001",
  "customer_id": "C100",
  "merchant_id": "M500",
  "device_id": "D10",
  "amount": 8500,
  "currency": "INR",
  "channel": "CARD",
  "timestamp": "2026-08-21T12:30:00Z",
  "country": "SG",
  "card_present": false,
  "new_payee": true,
  "synthetic": true
}
```

## Rebuild the model

Training is offline and requires Python 3.11+ with NumPy. The Node runtime remains dependency-free.

```bash
python -m pip install -r ml/requirements.txt
npm run data:generate
npm run data:fidelity
python ml/train.py
npm test
```

The exporter calls the same [FeatureEngine](src/features.js) used during API inference. It assigns all transactions for a customer/scenario pair to a single split and excludes `LAUNDER_001` completely as the novel-family holdout. The generated dataset stays under `data/runtime/`; the small, versioned model artifact is committed under `models/`.

Current locked synthetic benchmark:

| Evaluation | Precision | Recall | F1 | False-positive rate |
| --- | ---: | ---: | ---: | ---: |
| Entity-aware test split | 74.9% | 75.6% | 75.2% | 8.4% |
| Novel holdout, ensemble | 67.3% | 87.7% | 76.2% | 13.8% |
| Novel holdout, fallback | 76.6% | 59.0% | 66.7% | 5.8% |

Generator version `synthetic-1.1` deliberately introduces benign transactions that resemble fraud and probabilistic attack-signal expression. The resulting tradeoff is less flattering but more credible: the unseen-family ensemble gains 9.5 F1 points and 28.7 recall points over fallback, at a 7.9-point false-positive-rate cost. These remain synthetic results, not production claims.

## Architecture decision

The planning documents proposed six deployable services immediately. The MVP uses a **modular monolith** instead: the catalog, generator, feature engine, risk policy, evaluation loop, feedback queue, HTTP adapter, and UI are separate modules but one process.

That choice is deliberate for a short challenge window:

- one command reliably demonstrates the full loop;
- training and inference feature logic stay together, limiting skew;
- API and module boundaries remain explicit, so hot components can be extracted later;
- an external Python model can replace the transparent baseline behind an adapter without changing `/score`.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the migration path and design constraints.

## Recommended next milestones

1. Train a candidate artifact from approved mutation batches and demonstrate locked before/after evidence.
2. Benchmark LightGBM/XGBoost against the locked linear model without changing the policy API.
3. Add persisted scenario/feedback registries (PostgreSQL) and cached online features (Redis) only when the demo requires multi-process state.
4. Add Prometheus-compatible metrics and a controlled drift test.
5. Add artifact signing, approval states, and rollback metadata before any shadow-mode trial.

## Responsible-use guardrails

- All generated identifiers and transactions are fictional and explicitly tagged `synthetic`.
- Generative AI belongs in offline scenario research and mutation, never in the synchronous decision path.
- Every decision includes model and feature versions, reason codes, and latency.
- Feedback queues candidates for reviewed retraining; it never updates a live model automatically.
- Metrics from this prototype are demonstration evidence, not production-readiness claims.
