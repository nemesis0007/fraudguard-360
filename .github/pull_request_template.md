## Summary

Describe the problem and the implemented change.

## Architecture boundary

- [ ] Threat/campaign registry
- [ ] Synthetic generation/data
- [ ] Features/graph
- [ ] Model/registry
- [ ] Real-time decision path
- [ ] Feedback/learning
- [ ] UI/documentation
- [ ] Deployment/operations

## Evidence

- [ ] `npm run check` passes
- [ ] Fidelity audit updated when generator/data changed
- [ ] API documentation updated when a contract changed
- [ ] Model/data versions and checksums updated when artifacts changed
- [ ] Failure/fallback path tested

## Safety and governance

- [ ] Synthetic-only boundary preserved
- [ ] No secrets, credentials, PII, or private datasets added
- [ ] No generative model introduced into the real-time path
- [ ] No automatic training or model promotion introduced
- [ ] Prototype metrics are not presented as production claims

## Rollback

Explain how this change can be reverted safely.
