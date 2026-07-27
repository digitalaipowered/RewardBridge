# RewardBridge Supabase production status

## Project

- Name: RewardBridge Network
- Project ref: `fmywfaffczulebozlpsx`
- URL: `https://fmywfaffczulebozlpsx.supabase.co`
- Region: `us-east-2`

## Deployed database controls

The production database currently includes:

- publisher accounts and isolated publisher projects
- project API keys stored as hashes
- end-user mappings and short-lived survey sessions
- raw provider events and provider transactions
- provider cash receipts and owner reconciliation
- append-only multi-scope ledger entries
- CPX completion allocation: 45% end user, 25% platform, 10% reserve, 20% publisher
- CPX bonus allocation: 100% end user
- fixed $25 automatic publisher payout review threshold
- configurable end-user minimum with a hard $2 floor
- automatic movement of the full eligible publisher balance from available to held
- one active publisher payout review per publisher
- verified PayPal destination workflow
- owner approval, return-to-review, mark-paid, failure, rejection, pause, and resume controls
- payment-reference and destination-snapshot evidence
- append-only payout review events and owner audit logs
- publisher-safe payout RPC with simplified status and masked destination
- no publisher direct access to internal payout request rows
- global managed-network activation lock

## Publisher payout state model

```text
available cleared publisher margin
  → automatic review at $25
  → held balance
  → owner approval
  → processing
  → paid and settled
```

Failure and rejection use compensating entries to remove the amount from held and return it to available. The publisher is paused to prevent immediate automatic requeue until the issue is resolved and payouts are resumed.

## Deployed Edge Functions

- `platform-status` — public read-only status for the Worker and frontend
- `project-api-key` — one-time publisher secret-key generation and rotation
- `survey-session` — authenticated server-to-server hosted-session creation
- `cpx-surveys` — CPX API survey retrieval and fixed reward calculation
- `survey-portal` — short-lived session exchange and hosted survey preparation
- `cpx-postback` — CPX source-IP and secure-hash validation, pending allocation, idempotency, and reversals
- `payout-dispatch` — owner-only safety guard; automatic PayPal API dispatch is disabled

## Current payout execution mode

```text
publisher_auto_review_enabled=true
publisher_payment_execution_mode=owner_confirmed
publisher_payout_min_usd=25.00
```

The owner dashboard performs two separate actions:

1. Approve the reviewed payout after destination and account checks.
2. Record payment only after the payment has actually been completed, using a payment reference.

PayPal API credentials are not required for this mode. Adding them does not activate automatic dispatch because the deployed `payout-dispatch` function is a fail-closed guard.

## Required Edge Function secret

Do not commit this value:

```text
CPX_SECURE_HASH
```

`CPX_APP_ID=34813` is stored in protected platform configuration. Supabase provides its own project URL and backend keys to hosted Edge Functions. The browser uses only the public publishable key.

## Auth URL configuration

Active Site URL:

```text
https://6028ef2dad7c557eb4.v2.appdeploy.ai/
```

Allowed redirect URLs:

```text
https://6028ef2dad7c557eb4.v2.appdeploy.ai/**
https://rewardbridge.freehosting.dev/**
```

Do not change the active Site URL to InfinityFree until the staged copy is verified and the platform setting is deliberately switched.

## Verification completed

- Full automatic-review → approve → mark-paid flow passed inside a rollback transaction.
- The test moved $30 from available to held and then to settled.
- The paid action required a verified destination and payment reference.
- All synthetic users, payouts, payout events, and ledger rows were rolled back.
- Current production counts remain zero for publishers, payouts, payout events, and ledger entries.
- Security review closed direct publisher access to internal payout rows and the internal trigger RPC.
- Performance review indexes the new payout audit foreign keys.

## Activation rule

The managed-network flag remains false until the complete publisher, project, survey, reversal, provider-receipt, payout-review, and payment-record path has been verified with controlled production evidence.
