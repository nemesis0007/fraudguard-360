# Security policy

## Supported scope

FraudGuard 360 is a synthetic research prototype. Security reports should target the latest `main` branch.

## Reporting

Do not open a public issue containing credentials, personal data, exploit details, or information that could affect real payment systems. Contact the repository owner privately through GitHub instead.

## Safety boundary

- No real PAN, credentials, customer PII, or institution-confidential data.
- No live issuer, gateway, wallet, core-banking, or card-network integration.
- No generative model in the real-time decision path.
- No automatic model retraining or promotion.
- No operational instructions for committing payment fraud.

The payment endpoint is a simulator and always reports `external_call_made: false` and `live_payment_access: false`.

## Secrets

The current runtime requires no secret. Never commit `.env`, API keys, access tokens, cookies, deployment credentials, or private data. Use managed environment variables if future integrations are introduced.

## Before any external-data pilot

Add authenticated ingress, authorization, rate limiting, input schemas, encryption, durable audit storage, managed secrets, dependency scanning, artifact signing, retention controls, privacy review, model-risk approval, incident response, and tested rollback.
