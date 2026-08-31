# Auralis Risk AI Defense Lab

[Live engineering workspace](https://fraudguard-360.vercel.app/) · [Synthetic dataset](data/README.md) · [API reference](docs/API_REFERENCE.md)

Auralis Risk is an adaptive, privacy-safe red-team / blue-team fraud-defense lab for the Mastercard GFF 2026 challenge. It identifies GenAI-enabled fraud patterns, generates synthetic evidence only after human approval, fuses transaction and graph signals, explains every intervention, and sends detection gaps into a controlled learning queue.

> Prototype boundary: this repository uses synthetic data only. It does not connect to real credentials, customer data, or payment authorization systems, and it does not provide instructions for committing fraud.

This competition does not provide a dataset. Auralis therefore uses a **hybrid evidence strategy**: the versioned synthetic twin is active now; public fraud/AML simulators are reference anchors for schema and realism checks; restricted institution aggregates are reserved for an authorized shadow-mode pilot. The code never claims that reference or pilot data has already been ingested.

## Team entry points

| Start here | Use it for |
| --- | --- |
| [Engineering guide](docs/ENGINEERING_GUIDE.md) | Local setup, repository map, request lifecycle, data/model workflows |
| [API reference](docs/API_REFERENCE.md) | Endpoint contracts, payloads, response fields, and errors |
| [System architecture](ARCHITECTURE.md) | Offline, nearline, real-time, storage, feedback, and migration boundaries |
| [Operations runbook](docs/OPERATIONS.md) | Configuration, health checks, releases, rollback, and troubleshooting |
| [Contributing](CONTRIBUTING.md) | Branching, required evidence, pull requests, and review checklist |
| [Security policy](SECURITY.md) | Safety boundary, secrets, reporting, and pilot requirements |
| [Dataset card](data/README.md) | Download, schema, composition, lineage, and checksums |

## What is working now

- A genuine optional hosted GenAI threat analyst using Groq's OpenAI-compatible API, strict JSON/schema validation, safety filtering, provenance, and `PENDING_REVIEW` / `APPROVED` / `REJECTED` states. Without a key, the same workflow remains demonstrable through a clearly labeled bounded fallback analyst.
- A hard approval gate: discovered and feedback-derived scenarios cannot enter the simulator until a human reviewer approves them.
- A portable `auralis-xgb-210k` challenger trained only on the canonical 210,000-row benchmark, loaded directly by the Node runtime without a remote Python dependency.
- An interactive XGBoost input console on the website showing fraud probability, risk, model version, provider, and latency.
- An artifact-backed Evidence workspace comparing the linear baseline, active XGBoost model, and completely excluded-family holdout; it exposes every confusion-matrix count, labels open production gaps, and can rerun a seeded holdout proof without retraining.

- 22 versioned attack families spanning account and recovery takeover, CNP, token provisioning, QR substitution, mule and remittance networks, bots, BNPL bust-out, refund and loyalty abuse, instant-payment scams, synthetic identity, merchant laundering, subscriptions, contactless relay, payroll and invoice redirection, gift-card conversion, layering, promotion abuse, and friendly fraud.
- Deterministic seeded transaction generation with monotonic event time, provenance, synthetic-data flags, and controlled hard negatives.
- A committed synthetic-fidelity report with 12 automated gates covering reproducibility, schema, class balance, overlap, correlation, feature ranges, and privacy.
- A downloadable [210,000-row compressed benchmark](data/releases/fraudguard-360-synthetic-dataset-210k.zip), a [4,200-row browsable sample](data/sample/training-dataset.sample.jsonl), and a [dataset card with checksums](data/README.md).
- Stateful velocity, amount, device, graph-proxy, account, merchant, payee, and geography features.
- A trained NumPy logistic model blended with explainable rule signals, with a locked JSON artifact and feature manifest.
- Configurable `ALLOW`, `STEP_UP`, `REVIEW`, and `BLOCK` thresholds plus safe transparent fallback when the artifact is unavailable.
- Customer-entity train/validation/test splits and a completely excluded attack-family holdout.
- Red-vs-blue evaluation with precision, recall, F1, false-positive rate, and a confusion matrix.
- Feedback classification and a controlled retraining-candidate queue.
- Defense-guided mutation that turns actual false negatives into traceable stress variants under an explicit human-review gate.
- An agent-based payment-network twin with customers, merchants, devices, relationships, and counterfactual normal/attacked branches.
- An adaptive three-round arena: baseline, transaction-only attack, and graph-aware defense.
- Quantified prevented-value lift, exposure reduction, customer friction, defender/attacker advantage, and decision receipts.
- A realistic company site and interactive entity graph backed by the live API rather than hard-coded demo numbers.
- A shared versioned API envelope and explicit hybrid-data provenance manifest.
- An explicit sub-100 ms real-time pipeline: transaction ingestion → online features/store → locked-model inference → deterministic decision engine → response and audit service.
- Versioned threat repository, synthetic data vault, feature store, model registry, decision audit store, and an isolated issuer/payment simulator matching the reference architecture.
- A 24-campaign AI-native threat atlas with named AI enablers, payment surfaces, four-stage observable kill chains, novelty/difficulty scores, signal fingerprints, and expected controls.
- A genuine local multi-agent mission engine: six goal-driven agents select a campaign, propose competing policies, execute them in isolated twins, score outcomes, retain the winner, and adapt the defender across generations.
- A live operations interface that exposes agent actions and observations, policy evolution, champion controls, and the sealed handoff into the manual arena rather than presenting only aggregate numbers.
- A visible challenge proof ledger mapping the working prototype to Identify, Generate, Defend, and the closed learning loop.
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
| `GET` | `/api/v1/campaign/catalog` | AI-native campaigns, kill chains, signal fingerprints, and defenses |
| `GET` | `/api/v1/challenge/coverage` | Visible proof and remaining gaps for each challenge pillar |
| `GET` | `/api/v1/agents/health` | Local agent roster, objectives, execution mode, and safety boundary |
| `POST` | `/api/v1/agents/mission` | Run a bounded multi-generation red/blue mission in synthetic twins |
| `GET` | `/api/v1/threat-lab/health` | GenAI provider, model, approval states, and safety boundary |
| `POST` | `/api/v1/threat-lab/discover` | Produce a validated scenario draft that is not simulation-ready |
| `POST` | `/api/v1/threat-lab/scenarios/:id/review` | Approve or reject a generated scenario |
| `POST` | `/api/v1/threat-lab/scenarios/:id/simulate` | Generate evidence only from an approved scenario |
| `POST` | `/api/v1/threat-lab/from-feedback` | Convert aggregated false-negative gaps into a new review draft |
| `POST` | `/api/v1/model/challenger/predict` | Score the canonical feature vector with the locked 210k XGBoost challenger |
| `POST` | `/api/v1/simulate` | Generate a traceable synthetic dataset |
| `POST` | `/api/v1/score` | Score a live-style transaction |
| `POST` | `/api/v1/evaluate` | Run a red-vs-blue evaluation |
| `POST` | `/api/v1/evaluate/holdout` | Compare the ensemble and fallback on an excluded attack family |
| `GET` | `/api/v1/evaluation/scorecard` | Baseline, champion, excluded-family metrics, evidence gates, and attack coverage roles |
| `POST` | `/api/v1/learn/mutate` | Generate reviewed defensive variants from false negatives without retraining or promotion |
| `POST` | `/api/v1/feedback` | Record predicted vs actual outcome |
| `GET` | `/api/v1/model/health` | Locked model manifest, feature version, holdout, and test metrics |
| `GET` | `/api/v1/fidelity/report` | Synthetic generator quality gates, diagnostics, and limitations |
| `GET` | `/api/v1/data/evidence` | Active/reference/pilot data layers and governance gates |
| `GET` | `/api/v1/architecture` | Executable offline, nearline, real-time, feedback, and infrastructure topology |
| `GET` | `/api/v1/audit/recent` | Recent append-style decision audit records |
| `GET` | `/api/v1/metrics/summary` | Dashboard metrics and recent decisions |
| `POST` | `/api/v1/arena/run` | Run the counterfactual digital twin and adaptive red/blue exercise |
| `POST` | `/api/v1/payments/simulate` | Execute the complete authorization path against an isolated issuer/payment simulator |

Example autonomous mission:

```bash
curl -X POST http://localhost:8080/api/v1/agents/mission \
  -H "content-type: application/json" \
  -d '{"campaignId":"POLICY_ORACLE_003","objective":"GRAPH_EVASION","generations":4,"volume":110,"seed":2026}'
```

The policy mission runner remains deterministic autonomous orchestration within a deliberately narrow action space. Separately, the threat lab can use a hosted LLM for offline scenario analysis when `GROQ_API_KEY` is configured. Both paths are restricted to synthetic metadata and simulation; neither can use credentials, customer data, or live payment rails.

Example arena request:

```bash
curl -X POST http://localhost:8080/api/v1/arena/run \
  -H "content-type: application/json" \
  -d '{"campaignId":"AGENT_INTENT_001","volume":130,"seed":42,"aggression":0.72,"stealth":0.64,"defenderStrength":0.78,"graphDefense":true}'
```

The response contains three comparable rounds, an entity graph, a forensic timeline, business-impact metrics, and explainable decision receipts. Inputs are bounded and high-level; the simulator does not expose operational instructions for committing fraud.

## AI-native campaign atlas

The arena deliberately avoids presenting old fraud categories as if they were novel. Twenty-four higher-order campaigns compose AI capability, payment surface, temporal sequence, and hidden entity behavior:

1. **Ghost Cart** — delegated-commerce intent hijacking.
2. **Consent Mirage** — deepfake consent relayed across inconsistent channels.
3. **Glass Box** — a learning swarm that infers policy boundaries from outcomes.
4. **Sleeper Garden** — synthetic identities that mature separately and activate together.
5. **Mirage Market** — generative storefronts hiding stable merchant infrastructure.
6. **Shard Route** — cross-rail value fragments that only reveal risk when reconstructed.
7. **Clean Label** — delayed disputes used to corrupt the defender's view of training truth.
8. **Perfect Stranger** — mutually consistent synthetic KYC artifacts with weak provenance.
9. **Quiet Provision** — fraud hidden inside a plausible device-token lifecycle.
10. **Hive Coupon** — cooperative low-value account swarms with emergent community behavior.
11. **Trust Ladder** — beneficiaries warmed gradually before coordinated value movement.
12. **Semantic Switch** — enterprise payment agents agreeing on manipulated invoice intent.
13. **Recovery Ghost** — conversational recovery agents creating a cross-channel identity fracture.
14. **Chameleon Code** — context-matched QR surfaces resolving to unrelated settlement destinations.
15. **Limit Loom** — coordinated credit stacking across isolated BNPL providers.
16. **Point Doppel** — loyalty redemptions that mimic customer preferences but share endpoints.
17. **Trial Constellation** — synthetic subscription personas with synchronized lifecycle behavior.
18. **Merchant Mask** — generative catalogs and descriptors concealing stable settlement infrastructure.
19. **Tap Shadow** — contactless sessions with impossible combined proximity evidence.
20. **Corridor Composer** — adaptive value routing across providers, currencies, and borders.
21. **Payroll Whisper** — employee-style workflow messages redirecting payroll destinations.
22. **Gift Cascade** — stored-value fragments reconverging at shared redemption endpoints.
23. **Phantom Return** — generated return evidence reused across customers and refund paths.
24. **Device Chorus** — emulated wallet sessions sharing hidden attestation residue.

Each campaign is a safe defensive abstraction. It describes observable telemetry and mitigations, never victim targeting, credential theft, or instructions for interacting with live rails.

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

Training is offline and requires Python 3.11+ with NumPy, scikit-learn, and XGBoost. The deployed Node runtime remains dependency-free because the trees are exported into a portable JSON artifact.

```bash
python -m pip install -r ml/requirements.txt
npm run data:generate
npm run data:fidelity
python ml/train_xgboost.py
npm run model:holdout
npm test
```

The exporter calls the same [FeatureEngine](src/features.js) used during API inference. It assigns all transactions for a customer/scenario pair to a single split and excludes `LAUNDER_001` completely as the novel-family holdout. The reproducible working copy stays under ignored `data/runtime/`; GitHub contains the complete compressed benchmark under [`data/releases/`](data/releases/), a sample under [`data/sample/`](data/sample/), and the versioned model artifact under [`models/`](models/).

The canonical export contains exactly 210,000 rows: 10,000 transactions for each of 21 training scenarios, with `LAUNDER_001` held out completely. The challenge artifact and metrics below use this dataset only.

Current locked synthetic benchmark:

| Evaluation | Precision | Recall | F1 | False-positive rate |
| --- | ---: | ---: | ---: | ---: |
| XGBoost, entity-aware test split | 78.5% | 83.0% | 80.7% | 7.6% |
| XGBoost, excluded `LAUNDER_001` family | 76.4% | 85.6% | 80.7% | 8.5% |
| Linear baseline, entity-aware test split | 77.2% | 77.3% | 77.3% | 7.6% |

Generator version `synthetic-1.1` deliberately introduces benign transactions that resemble fraud and probabilistic attack-signal expression. Against the same entity-aware test split, the XGBoost challenger improves F1 by 3.42 points and recall by 5.70 points over the linear baseline while keeping the false-positive rate essentially unchanged. The excluded-family result is generated separately with a fixed seed and never enters training. These remain synthetic results, not production claims.

## Architecture decision

The reference design is implemented as a **modular monolith with deployable service boundaries**. Offline/nearline discovery and generation are separated from the deterministic real-time path. Transaction ingestion, online features, model inference, decision policy, response, audit, registries, and payment simulation are distinct classes and contracts, while one dependency-free process keeps the challenge demo reliable. These boundaries can be extracted independently when scale or governance requires it.

That choice is deliberate for a short challenge window:

- one command reliably demonstrates the full loop;
- training and inference feature logic stay together, limiting skew;
- API and module boundaries remain explicit, so hot components can be extracted later;
- an external Python model can replace the transparent baseline behind an adapter without changing `/score`.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the migration path and design constraints.

## Data and model choices

### Dataset

The current runnable dataset is generated by `src/generator.js` from 22 governed scenarios. Every row is fictional, labeled `synthetic`, seeded for reproducibility, and includes provenance. Benign hard negatives deliberately resemble fraud. `src/twin-engine.js` creates a separate baseline and attacked branch so the dashboard can compare what would have happened without the attack and after a graph-aware response.

Public sources such as the Fraud Detection Handbook simulator and IBM AMLSim / AML-Data are listed as **reference-only** in `src/evidence.js`. They are useful future anchors for temporal, imbalance, and graph diagnostics, but they are not silently blended into the current benchmark. A real pilot should ingest only authorized aggregates, then recalibrate distributions and business costs without bringing raw card data into this lab.

### Model

The public model console runs the portable `auralis-xgb-210k` artifact directly in the Node service. On the canonical entity-aware synthetic test split it reports 78.49% precision, 83.00% recall, 80.68% F1, 0.9442 ROC-AUC, 0.8806 PR-AUC, and a 7.60% false-positive rate at threshold 0.405. These are synthetic demonstration results, not production claims.

The hot path combines a locked NumPy-trained logistic artifact with deterministic reason-code rules. It was chosen because the prototype needs reproducibility, explainability, very low operational complexity, and a safe fallback. It is not presented as the final production model. A governed benchmark should compare it with LightGBM/XGBoost for local transaction risk and a temporal graph model for relationship risk, while retaining the same final policy API.

### Two-speed defense

1. The transaction model produces a fast local score from velocity, amount, device, geography, payee, account, identity, and merchant signals.
2. The twin calculates a graph signal from the simulated entity motif.
3. Policy fusion issues `ALLOW`, `STEP_UP`, `REVIEW`, or `BLOCK` and preserves both component scores.
4. A missing model artifact falls back to transparent rules; graph fusion can be disabled independently in the arena.
5. Misses become reviewed mutation candidates. No replay automatically retrains or promotes a model.

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
