# Operations runbook

## Supported execution modes

| Mode | Command or entrypoint | Persistence |
| --- | --- | --- |
| Local Node server | `npm start` | In memory until restart |
| Development watch | `npm run dev` | In memory; restarts on code change |
| Docker | `docker compose up --build` | In memory per container lifecycle |
| Vercel | `api/index.js` | Warm-instance state only; not durable |

The current system is a research prototype. Feature and audit stores must be replaced before multi-instance or production use.

## Configuration

| Variable | Default | Constraint |
| --- | ---: | --- |
| `PORT` | `8080` | Local server only |
| `FG_ALLOW_THRESHOLD` | `35` | Must be below review |
| `FG_REVIEW_THRESHOLD` | `60` | Must be between allow and block |
| `FG_BLOCK_THRESHOLD` | `80` | Must be above review |
| `FG_MODEL_PATH` | `models/fraudguard-linear-v1.json` | Locked JSON artifact |

The service fails startup when threshold ordering is invalid. If the model file is absent or invalid, health reports `FALLBACK` and scoring uses transparent rules.

## Health checks

```bash
curl http://localhost:8080/health
curl http://localhost:8080/api/v1/model/health
curl http://localhost:8080/api/v1/architecture
curl http://localhost:8080/api/v1/fidelity/report
```

A ready deployment should report service health, model status `READY`, architecture `FRAUDGUARD_CLOSED_LOOP_V1`, and fidelity status `PASS`.

## Release procedure

1. Run `npm run check`.
2. Run `npm run data:fidelity` if generator or dataset behavior changed.
3. Review `git diff --check` and the pull-request checklist.
4. Merge to `main` after approval.
5. Deploy the exact `main` commit.
6. Verify `/`, `/health`, `/api/v1/architecture`, `/api/v1/model/health`, and one `/api/v1/payments/simulate` request.
7. Record the deployment URL and commit in the pull request or release note.

## Rollback

Code rollback: redeploy the previous known-good commit. Model rollback: restore the prior locked model file and redeploy; no runtime model promotion exists. Threshold rollback: restore prior environment values and redeploy/restart. Never change model and thresholds together without separate before/after evidence.

## Troubleshooting

### Model reports fallback

- Confirm `FG_MODEL_PATH` or the default artifact exists.
- Validate the artifact has feature order, weights, normalization means/scales, and version metadata.
- Check that deployment packaging includes `models/**`.

### Dataset or architecture endpoint fails on hosted runtime

- Confirm deployment packaging includes `data/dataset-manifest.json`.
- Do not package `data/runtime/` or the complete training ZIP inside a serverless function.

### Decisions differ between repeated requests

Behavioral features are stateful per customer and device. Use new identifiers or a fresh platform instance for isolated tests.

### Mission function times out

Reduce generations or events per candidate. Hosted functions have execution-duration limits; the UI defaults are bounded but multi-generation twin runs are compute-heavy.

### UI loads but APIs return 404

Verify the Vercel rewrites in `vercel.json` direct `/health` and `/api/v1/*` to `api/index.js`.

## Monitoring gaps before pilot

- Durable structured logs and traces
- Error-rate and latency alerts
- Drift and feature-freshness monitors
- Persistent audit and feedback storage
- Signed artifact promotion and rollback records
- Authentication, authorization, rate limiting, and secrets management
