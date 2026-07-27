# RewardBridge Network

RewardBridge is a controlled-beta managed survey infrastructure platform for web publishers.

## Current production state

- Active site: https://6028ef2dad7c557eb4.v2.appdeploy.ai/
- Reserved future site: https://rewardbridge.freehosting.dev/
- Supabase project ref: `fmywfaffczulebozlpsx`
- Supabase region: `us-east-2`
- Requested Worker: `https://misty-mode-a1d4.digitala-ipowered.workers.dev`
- Publisher withdrawal minimum: **$25.00**
- Lowest permitted end-user payout minimum: **$2.00**
- Managed CPX traffic: **disabled pending written CPX approval**

## Safety boundaries

- CPX provider events create pending records only.
- Funds are released only after the matching provider payment is received and reconciled.
- Financial ledger entries are append-only.
- Project secret API keys are stored as hashes and shown once when generated.
- PayPal dispatch remains inactive until approved credentials and verified payout destinations are configured.
- Do not commit CPX secure hashes, postback tokens, PayPal secrets, Supabase secret keys, or FTP passwords.

## InfinityFree staging

The workflow at `.github/workflows/stage-infinityfree.yml` mirrors the verified AppDeploy frontend and uploads it to `/htdocs` through FTPS. It is manual-only and requires the following repository secrets:

- `INFINITYFREE_FTP_USERNAME`
- `INFINITYFREE_FTP_PASSWORD`

The FTP hostname is fixed to `ftpupload.net`. Rotate the password shown in any screenshot before storing it as a GitHub secret.

## Required before live CPX traffic

1. Receive written CPX approval for the managed distribution structure.
2. Create the CPX application using the active AppDeploy URL.
3. Confirm exact CPX postback placeholders and reversal status values.
4. Configure CPX secrets in Supabase Edge Function secrets.
5. Complete PayPal Payouts sandbox validation.
6. Obtain professional legal review of the public policies and publisher agreement.
7. Keep the global managed-network switch disabled until all items above are verified.
