# RewardBridge Supabase production status

## Project

- Name: RewardBridge Network
- Project ref: `fmywfaffczulebozlpsx`
- URL: `https://fmywfaffczulebozlpsx.supabase.co`
- Region: `us-east-2`

## Active provider configuration

```text
CPX App ID: 34813
Managed network enabled: true
Completion reward factor: 0.45
Bonus reward factor: 1.00
```

CPX App 34813 is approved and active. Publisher and project status, allowed origins, provider cash reconciliation, fraud controls, and payout controls remain independently enforceable.

## Deployed database controls

The production database currently includes:

- publisher accounts and isolated publisher projects
- unique project application URLs per publisher
- project API keys stored as hashes
- project-key entropy generated through `extensions.gen_random_bytes()`
- end-user mappings and short-lived survey sessions
- raw provider events and provider transactions
- provider cash receipts and owner reconciliation
- append-only multi-scope ledger entries
- CPX completion allocation: 45% end user, 25% platform, 10% reserve, 20% publisher
- CPX bonus allocation: 100% end user
- fixed publisher-pool share value: 69.230769%, stored at six-decimal precision
- fixed $25 automatic publisher payout review threshold
- configurable end-user minimum with a hard $2 floor
- automatic movement of the full eligible publisher balance from available to held
- one active publisher payout review per publisher
- normalized PayPal destination validation and verification workflow
- owner approval, return-to-review, mark-paid, failure, rejection, pause, and resume controls
- payment-reference and destination-snapshot evidence
- append-only payout review events and owner audit logs
- publisher-safe payout RPC with simplified status and masked destination
- no publisher direct access to internal payout request rows

## Active initial records

```text
Publisher: Crimson
Publisher status: approved
CPX network status: active
Project: Crimson Forge
Project URL: https://crimsonforge.gamer.gd
Project status: active
End-user payout minimum: $5.00
PayPal destination: submitted, pending verification
```

No publisher reward, payout, or ledger value was fabricated during setup.

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

- The project-creation failure caused by the pgcrypto schema was reproduced and fixed.
- The reward-share precision constraint failure was reproduced and fixed.
- The valid PayPal destination rejection was reproduced and fixed.
- Crimson Forge was created once and activated at its production URL.
- The owner PayPal destination was accepted and stored as pending verification.
- Full automatic-review → approve → mark-paid flow passed inside a rollback transaction.
- The payout test moved $30 from available to held and then to settled.
- All synthetic payout test records were rolled back.
- Security review closed direct publisher access to internal payout rows and the internal trigger RPC.
- Performance review indexes the payout audit foreign keys.

## Controlled rollout rule

The managed network is active. New publishers, projects, app origins, credentials, and payout destinations remain reviewable and pausable. Provider-reported revenue remains pending until corresponding CPX cash is received and reconciled.
