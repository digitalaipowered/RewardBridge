# RewardBridge Network

RewardBridge is a controlled-beta managed survey infrastructure platform for web publishers.

## Current production state

- Active frontend: https://6028ef2dad7c557eb4.v2.appdeploy.ai/
- Reserved future frontend: https://rewardbridge.freehosting.dev/
- Supabase project ref: `fmywfaffczulebozlpsx`
- Supabase region: `us-east-2`
- Gateway Worker: https://misty-mode-a1d4.digitala-ipowered.workers.dev/rewardbridge/
- Publisher withdrawal minimum: **$25.00**
- Lowest permitted end-user payout minimum: **$2.00**
- Platform fee: **25%**
- Initial risk reserve: **10%**
- Managed CPX traffic: **disabled pending written CPX approval**

## Repository contents

- `src/` — production React frontend source
- `public/` — Privacy, Terms, Publisher Agreement, Rewards Terms, and Contact pages
- `cloudflare/merged-worker.js` — full misty-mode Worker preserving Crimson Forge/GamePix routes and adding isolated RewardBridge routes
- `wrangler.toml` — merged Worker deployment configuration
- `supabase/README.md` — deployed database and Edge Function status
- `setup/REQUIRED_CONFIGURATION.md` — remaining owner-side setup
- `.github/workflows/build-infinityfree.yml` — creates a validated InfinityFree upload ZIP
- `.github/workflows/stage-infinityfree.yml` — manual FTPS staging deployment
- `.github/workflows/deploy-worker.yml` — manual guarded Worker deployment

## Safety boundaries

- CPX provider events create pending records only.
- Funds are released only after the matching provider payment is received and reconciled.
- Financial ledger entries are append-only.
- Project secret API keys are stored as hashes and shown once when generated.
- PayPal dispatch remains inactive until approved credentials and verified payout destinations are configured.
- Never commit CPX secure hashes, postback tokens, PayPal secrets, Supabase secret keys, Cloudflare tokens, or FTP passwords.

## InfinityFree

`build-infinityfree.yml` mirrors and validates the verified AppDeploy release, adds `.htaccess`, scans for forbidden secret markers, generates SHA-256 checksums, and produces `RewardBridge-InfinityFree-upload.zip` as a GitHub Actions artifact.

`stage-infinityfree.yml` can upload the validated release to `/htdocs` after these repository secrets are added:

- `INFINITYFREE_FTP_USERNAME`
- `INFINITYFREE_FTP_PASSWORD`

Rotate any password exposed in a screenshot before storing it as a secret.

## Required before live CPX traffic

1. Receive written CPX approval for the managed distribution structure.
2. Create the CPX application using the active AppDeploy URL.
3. Confirm exact CPX postback placeholders and reversal status values.
4. Configure CPX and PayPal secrets in Supabase Edge Function secrets.
5. Add the active and future frontend URLs to Supabase Auth URL Configuration.
6. Complete PayPal Payouts sandbox validation.
7. Obtain professional legal review of the public policies and publisher agreement.
8. Keep the global managed-network switch disabled until all items are verified.
