# RewardBridge Supabase production status

## Project

- Name: RewardBridge Network
- Project ref: `fmywfaffczulebozlpsx`
- URL: `https://fmywfaffczulebozlpsx.supabase.co`
- Region: `us-east-2`

## Deployed database controls

The production database currently includes:

- publisher accounts and projects
- isolated project API keys
- end-user mappings and survey sessions
- raw provider events and provider transactions
- provider cash receipts and reconciliation
- append-only multi-scope ledger entries
- publisher and end-user payout requests
- verified payout-method workflow
- risk signals, webhooks, agreement acceptance, and owner audit logs
- fixed $25 publisher withdrawal minimum
- configurable end-user minimum with a hard $2 floor
- 25% platform fee and 10% initial reserve
- global managed-network activation lock
- active AppDeploy URL, future InfinityFree URL, Worker URL, and support-email configuration

## Deployed Edge Functions

- `platform-status` — public read-only status for the Worker and frontend
- `project-api-key` — one-time publisher secret-key generation and rotation
- `survey-session` — authenticated server-to-server hosted-session creation
- `cpx-surveys` — CPX API survey retrieval, project economics, and owner-value ranking
- `survey-portal` — short-lived session exchange and hosted survey-wall preparation
- `cpx-postback` — provider event intake, pending allocation, duplicate handling, and reversals
- `payout-dispatch` — owner-only PayPal Payouts batching and status synchronization

## Required Edge Function secrets

Do not commit these values:

```text
CPX_APP_ID
CPX_SECURE_HASH
CPX_POSTBACK_TOKEN
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_MODE=sandbox
```

Supabase provides its own project URL, publishable keys, and backend secret keys to hosted Edge Functions. The browser uses only the public publishable key.

## Auth URL configuration still required

Set the Supabase Auth Site URL to:

```text
https://6028ef2dad7c557eb4.v2.appdeploy.ai/
```

Add these redirect URLs:

```text
https://6028ef2dad7c557eb4.v2.appdeploy.ai/**
https://rewardbridge.freehosting.dev/**
```

Do not change the active site URL to InfinityFree until the staged copy is verified and the platform setting is deliberately switched.

## Activation rule

The managed-network flag must remain false until written CPX approval, provider credentials, exact postback macros, reversal testing, and payout sandbox testing are complete.
