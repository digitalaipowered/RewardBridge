# RewardBridge Network

RewardBridge is a controlled-rollout managed survey infrastructure platform for web publishers.

## Current production state

- Active frontend: https://6028ef2dad7c557eb4.v2.appdeploy.ai/
- Reserved future frontend: https://rewardbridge.freehosting.dev/
- Supabase project ref: `fmywfaffczulebozlpsx`
- Supabase region: `us-east-2`
- Gateway Worker: https://misty-mode-a1d4.digitala-ipowered.workers.dev/rewardbridge/
- CPX App ID: **34813 — approved and active**
- CPX completion reward factor: **45%**
- CPX bonus pass-through: **100% to the end user**
- Platform fee: **25%**
- Risk reserve: **10%**
- Publisher margin: **20%**
- Automatic publisher payout review threshold: **$25.00 cleared balance**
- Lowest permitted end-user payout minimum: **$2.00**
- Publisher payment execution: **owner-confirmed after review**
- Managed CPX traffic: **enabled with publisher, project, origin, fraud, reconciliation, and payout controls**
- Active initial project: **Crimson Forge — https://crimsonforge.gamer.gd**
- Crimson Forge end-user payout minimum: **$5.00**
- Owner PayPal destination: **submitted and pending owner verification**

## July 27, 2026 repair release

This release corrected three production blockers:

1. Project creation now calls `extensions.gen_random_bytes()` from the installed pgcrypto schema.
2. Publisher reward-share storage now supports the exact fixed `69.230769%` publisher-pool allocation required to produce the 45% gross user reward.
3. PayPal email validation now accepts normalized valid addresses without the previous over-escaped regular expression.

It also activates CPX App 34813, creates and activates the Crimson Forge project, submits the owner PayPal destination, compacts the mobile dashboard into a 2×2 summary, adds quick dashboard navigation, and improves form and notice behavior.

## Repository contents

- `src/` — production React frontend source
- `public/` — Privacy, Terms, Publisher Agreement, Rewards Terms, and Contact pages
- `cloudflare/merged-worker.js` — full misty-mode Worker preserving Crimson Forge/GamePix routes and adding isolated RewardBridge routes
- `wrangler.toml` — merged Worker deployment configuration
- `supabase/README.md` — deployed database and Edge Function status
- `supabase/migrations/20260727_0540_activate_cpx_and_fix_publisher_setup.sql` — reproducible database repair migration
- `releases/2026-07-27-cpx-active-mobile-ux.md` — release verification and recovery notes
- `setup/CPX_APP_34813.md` — exact CPX application contract
- `setup/PUBLISHER_PAYOUT_WORKFLOW.md` — automatic publisher review and owner settlement procedure
- `setup/REQUIRED_CONFIGURATION.md` — remaining owner-side setup
- `.github/workflows/build-infinityfree.yml` — creates a validated InfinityFree upload ZIP
- `.github/workflows/stage-infinityfree.yml` — manual FTPS staging deployment
- `.github/workflows/deploy-worker.yml` — manual guarded Worker deployment

## Payout controls

- Eligible cleared publisher margin enters review automatically when it reaches $25.
- The full eligible balance is moved from available to held so it cannot be included in another payout.
- Each publisher may have only one active publisher payout review.
- Publisher-facing statuses are limited to Under review, Processing, Paid, and Action needed.
- Destination verification, owner notes, destination snapshots, and payment references are owner-only.
- A payout must be approved before it can be recorded as paid.
- Recording payment requires a verified destination and payment reference.
- Failed or rejected reviews release held funds through compensating ledger entries and pause further payout review until resumed.
- Automatic PayPal API dispatch is disabled; adding PayPal credentials cannot silently activate automatic payments.

## Safety boundaries

- CPX provider events create pending records only.
- Funds are released only after the matching provider payment is received and reconciled.
- Financial ledger and payout-event records are append-only.
- Project secret API keys are stored as hashes and shown once when generated.
- Publishers cannot directly read internal payout request rows or owner review fields.
- Project URLs are unique per publisher.
- Never commit CPX secure hashes, Supabase secret keys, Cloudflare tokens, FTP passwords, or payment credentials.

## InfinityFree

`build-infinityfree.yml` builds and validates the repository frontend, adds `.htaccess`, scans for forbidden secret markers, generates SHA-256 checksums, and produces `RewardBridge-InfinityFree-upload.zip` as a GitHub Actions artifact.

`stage-infinityfree.yml` can upload the validated release to `/htdocs` after these repository secrets are added:

- `INFINITYFREE_FTP_USERNAME`
- `INFINITYFREE_FTP_PASSWORD`

Keep AppDeploy active until the InfinityFree copy, Magic Links, legal pages, Worker route, and survey portal have been tested independently.

## Remaining controlled-rollout checks

1. Verify the submitted PayPal destination in the owner dashboard.
2. Run a low-value real CPX survey completion and reversal test through Crimson Forge.
3. Reconcile the first provider receipt.
4. Exercise the automatic $25 publisher payout-review path with real cleared funds.
5. Record a confirmed PayPal payment reference after the first real payout.
6. Obtain professional legal review of the public policies and publisher agreement.
