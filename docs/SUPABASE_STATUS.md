# Supabase production status

## Project

- Name: RewardBridge Network
- Project ref: `fmywfaffczulebozlpsx`
- Region: `us-east-2`
- Status: Active and healthy

## Runtime configuration

The `platform_settings` record currently enforces:

- Publisher payout minimum: `$25.00`
- End-user payout floor: `$2.00`
- Platform fee: `25%`
- Risk reserve: `10%`
- Managed network: disabled
- Active site: `https://6028ef2dad7c557eb4.v2.appdeploy.ai/`
- Future site: `https://rewardbridge.freehosting.dev/`
- Worker base: `https://misty-mode-a1d4.digitala-ipowered.workers.dev`

## Deployed Edge Functions

- `platform-status` — public safe configuration response
- `project-api-key` — authenticated one-time project secret generation
- `survey-session` — project-key authenticated short-lived session creation
- `survey-portal` — hosted session validation and CPX wall preparation
- `cpx-postback` — token-authenticated provider event processing
- `payout-dispatch` — owner-only PayPal Payouts dispatch and synchronization

## Financial controls

- Separate provider receivable, platform, reserve, publisher, and end-user scopes
- Append-only ledger trigger
- Idempotency keys on financial entries
- Provider postbacks create pending allocations only
- Cash reconciliation is required before balances become available
- Reversals create compensating entries
- Failed PayPal payouts restore the publisher balance through a compensating entry
- Publisher payout requests require at least `$25.00`
- End-user payout requests enforce each project's configured minimum and the global `$2.00` floor

## Still required outside the available connector

Supabase Auth's dashboard-level URL configuration must include the live AppDeploy URL now and the InfinityFree URL before Magic Link testing on InfinityFree. The current connector can manage the database and Edge Functions but does not expose Auth URL allowlist management.

## Secrets still required before activation

- `CPX_APP_ID`
- `CPX_SECURE_HASH`
- `CPX_POSTBACK_TOKEN`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_MODE`

Do not configure CPX secrets until the CPX application exists and the exact postback fields have been confirmed.
