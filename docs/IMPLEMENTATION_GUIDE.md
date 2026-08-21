# FraudGuard 360 — Step-by-Step Implementation Guide

## 1. The actual competition problem

The private Kaggle overview and public Luma brief describe an AI Defense Lab for Payment Security. There is no supplied dataset and no prediction leaderboard metric. This is a judged community hackathon.

The system must:

1. **Identify** a broad and deep landscape of novel GenAI-powered payment-fraud attacks.
2. **Generate** high-fidelity synthetic attacks and transactions at scale.
3. **Defend** with AI/ML that detects, flags, and mitigates attacks while keeping false positives low.

Judging covers:

- diversity of attacks;
- simulation fidelity;
- detection efficacy;
- novelty;
- real-world feasibility in live payments.

The required submission contains a complete runnable GitHub repository, a DOCX solution walkthrough, and a working web prototype with a presentable UI.

## 2. System boundary

FraudGuard separates the system into two paths.

**Offline / nearline**

- threat research;
- safe scenario design and mutation;
- synthetic dataset generation;
- model training and evaluation;
- reviewed feedback and candidate promotion.

**Real-time**

- deterministic feature calculation;
- trained-model inference;
- transparent risk rules;
- configurable policy decision;
- reason codes, model version, and latency.

Generative AI is never placed in the synchronous payment authorization path.

## 3. Attack catalog: Identify

The catalog in src/catalog.js currently covers:

1. account takeover;
2. card-not-present fraud;
3. mule networks;
4. bot-driven card testing;
5. refund abuse;
6. instant-payment scams;
7. synthetic identity;
8. transaction layering;
9. promotion abuse;
10. friendly fraud.

Each scenario has a stable ID, name, family, severity, and expected observable signals. Scenarios are defensive specifications and never contain real credentials or instructions for attacking payment systems.

## 4. Synthetic dataset: Generate

Run:

~~~bash
npm run data:generate
~~~

The exporter:

- generates 1,000 fictional transactions for each of nine training scenarios;
- uses fixed seeds for reproducibility;
- records scenario version and provenance;
- explicitly marks every row synthetic;
- calls the same FeatureEngine used by live inference;
- keeps each customer/scenario pair within a single split;
- excludes LAUNDER_001 as a fully unseen holdout family;
- writes 9,000 feature rows under ignored data/runtime/.
- labels controlled benign edge cases as `HARD_NEGATIVE` and expresses attack signals probabilistically;
- generates timestamps cumulatively so every scenario replay is time ordered.

Run `npm run data:fidelity` to produce `models/synthetic-fidelity-v1.json`. The current report passes 12/12 quality gates: deterministic replay, seed diversity, time ordering, schema completeness, identifier uniqueness, class-rate control, hard-negative prevalence and coverage, amount-distribution overlap, correlation ceiling, feature ranges, and the privacy boundary. These gates validate generator consistency and controlled overlap; without a production reference distribution, they cannot prove real-world realism.

### Dataset fields

The transaction generator creates fictional:

- transaction, customer, merchant, and device identifiers;
- amount, currency, channel, timestamp, and country;
- card-present and new-payee flags;
- account age, identity mismatch, and merchant-risk context;
- scenario ID, scenario version, synthetic flag, and fraud label.

### Split policy

| Partition | Approximate share | Purpose |
| --- | ---: | --- |
| Train | 70% | Learn coefficients |
| Validation | 10% | Select threshold |
| Test | 20% | Locked evaluation |
| LAUNDER_001 | Separate family | Novel-attack holdout |

The split hash contains both customer ID and scenario ID. A customer/scenario entity cannot cross partitions.

## 5. Features

src/features.js computes:

| Feature | Meaning |
| --- | --- |
| velocity_1h | Customer transactions observed in the prior hour |
| amount_deviation | Difference from the customer’s previous average amount |
| new_device | Device not seen in prior customer history |
| shared_device_count | Number of customers associated with one device |
| location_shift | Country differs from the MVP home-country assumption |
| new_payee | Payee is newly introduced |
| card_not_present | Remote/e-commerce payment signal |
| unusual_hour | Transaction occurs in a high-risk UTC hour |
| new_account | Account is younger than 30 days |
| identity_mismatch | Synthetic identity inconsistency signal |
| merchant_risk | Normalized merchant-risk input |

Transactions are processed in timestamp order. Training export and API inference use the same module to limit training-serving skew.

## 6. Model: Defend

The active artifact is a regularized logistic-regression model trained with NumPy in ml/train.py.

### Why logistic regression first

- coefficients are inspectable;
- training is reproducible;
- the live Node service reads a small JSON artifact;
- inference adds virtually no operational complexity;
- it provides a strong benchmark for LightGBM/XGBoost;
- the system can fall back to rules if the artifact is unavailable.

### Training

~~~bash
python -m pip install -r ml/requirements.txt
npm run data:generate
python ml/train.py
npm test
~~~

The trainer:

1. loads the feature rows;
2. standardizes values using training-only means and standard deviations;
3. balances fraud and legitimate training examples;
4. applies L2 regularization;
5. trains with deterministic gradient descent;
6. chooses a validation threshold under a false-positive constraint;
7. evaluates the untouched test split;
8. saves a versioned JSON artifact.

The model artifact contains feature order, normalization values, weights, bias, threshold, scenario manifest, split sizes, metrics, limitations, and a content-derived model version.

## 7. Evaluation

Current synthetic benchmark:

| Evaluation | Precision | Recall | F1 | False-positive rate |
| --- | ---: | ---: | ---: | ---: |
| Entity-aware test split | 0.749 | 0.756 | 0.752 | 0.084 |
| Novel holdout ensemble | 0.673 | 0.877 | 0.762 | 0.138 |
| Novel holdout fallback | 0.766 | 0.590 | 0.667 | 0.058 |

Generator version `synthetic-1.1` introduces hard negatives and partial signal expression. The unseen-family ensemble improves F1 by 0.095 and recall by 0.287 over fallback, while increasing the false-positive rate by 0.079. This makes the security/customer-friction tradeoff visible. It still does not prove production performance on real payment traffic.

## 8. Runtime decision engine

src/model-adapter.js validates and loads the artifact. src/risk-engine.js blends:

- 70% trained fraud probability;
- 30% transparent rule score.

The default policy is:

- score below 35 → ALLOW;
- score 35–59 → STEP_UP;
- score 60–79 → REVIEW;
- score 80+ → BLOCK.

Every score response includes:

- probability and final risk score;
- deterministic rule score;
- decision and risk level;
- top reason codes and contributions;
- feature and model versions;
- ENSEMBLE or SAFE_FALLBACK mode;
- measured latency.

## 9. Feedback loop

POST /api/v1/feedback receives predicted and actual outcomes. The platform classifies feedback as correct, false positive, or false negative. Errors become reviewed retraining candidates.

The live model never self-updates. The safe target flow is:

~~~text
Miss or false positive
  → select reviewed seed
  → apply safe mutation operators
  → generate hard cases
  → train candidate artifact
  → compare locked metrics
  → human approval
  → promote or reject
~~~

## 10. Web demonstration

The dashboard at / demonstrates:

- attack catalog size;
- synthetic replay;
- red-versus-blue evaluation;
- novel-family holdout comparison;
- defense-guided variant generation from observed false negatives;
- precision, recall, F1, and false-positive rate;
- recent explainable decisions;
- model version and runtime latency.
- the 12-gate synthetic-fidelity status.

The educational walkthrough is at /guide.html.

## 11. API map

- GET /health
- GET /api/v1/attack/catalog
- POST /api/v1/simulate
- POST /api/v1/score
- POST /api/v1/evaluate
- POST /api/v1/evaluate/holdout
- POST /api/v1/learn/mutate
- POST /api/v1/feedback
- GET /api/v1/model/health
- GET /api/v1/fidelity/report
- GET /api/v1/metrics/summary

## 12. Required next improvements

1. Train an isolated candidate artifact from approved mutation batches and produce locked before/after evaluation.
2. Benchmark LightGBM and XGBoost against the locked linear artifact.
3. Add graph-derived shared-entity and ring-density features.
4. Expand fidelity checks against an authorized aggregate reference if one becomes available.
5. Add drift tests, Prometheus metrics, and durable feedback storage.
6. Prepare and verify a public deployment.

## 13. Adversarial Twin Arena: the new product layer

The main website now calls `POST /api/v1/arena/run`. The request controls only bounded defensive-simulation concepts: scenario, volume, seed, aggression, stealth, defender strength, and whether graph fusion is active.

The arena executes three rounds:

1. **Counterfactual normal** — a low-fraud baseline world.
2. **Adaptive attack** — the selected scenario under transaction-only scoring.
3. **Graph-aware defense** — the same attacked world with entity context fused into policy.

The response is not a pre-rendered chart. It contains the simulated entity graph, graph motif, per-round payment value and loss exposure, customer-friction rate, attacker/defender advantage, a forensic timeline, and decision receipts with separate transaction and graph scores.

The novel attack labels map to safe observable behavior rather than operational instructions: authorization drift, probe-and-pivot behavior, merchant/mule collusion, dispute loops, synthetic-identity maturation, cross-rail fragmentation, payment coercion, and coordinated account swarms.

## 14. Why hybrid evidence beats fully synthetic data

The runnable lab remains synthetic-first because the competition provides no dataset and novel attacks need counterfactual labels. However, synthetic-only accuracy is not credible evidence of production efficacy. `/api/v1/data/evidence` therefore exposes three explicitly different layers:

- **Active synthetic twin** for labeled novelty and reproducible stress tests.
- **Reference-only public benchmarks** for future schema, temporal, imbalance, and graph realism checks.
- **Pilot-required institution aggregates** for threshold, drift, and business-cost calibration under authorization.

This is intentionally not an opaque blend. The current model has not been trained on a dataset merely because it is named as a reference. That provenance boundary is part of the product design.

## 15. Recommended production model evolution

Keep a two-speed architecture. A fast local model (the locked linear model today, then a governed LightGBM/XGBoost challenger) should remain on the authorization path. A separate temporal graph model should calculate relationship risk from devices, accounts, customers, merchants, and transfer paths. Policy fusion combines both scores and preserves a transparent fallback.

Only approved misses should enter retraining. The arena can propose mutated stress cases, but it never modifies or promotes the active model. A real deployment should progress through offline validation, shadow mode, step-up recommendations, selective blocking, artifact signing, and rollback-tested promotion.
