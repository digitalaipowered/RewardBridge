# Required configuration before managed publisher launch

## 1. Hosting security

The InfinityFree password shown previously should be considered exposed. Rotate it before using FTP or GitHub Actions. Do not reuse the old value.

## 2. Supabase Auth URLs

In Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://6028ef2dad7c557eb4.v2.appdeploy.ai/`
- Redirect URL: `https://6028ef2dad7c557eb4.v2.appdeploy.ai/**`
- Redirect URL: `https://rewardbridge.freehosting.dev/**`

Keep AppDeploy as the active Site URL until InfinityFree is staged and tested.

## 3. Supabase Edge Function secrets

Required for CPX App 34813:

```text
CPX_SECURE_HASH
```

`CPX_APP_ID=34813` is stored in protected platform configuration. `CPX_POSTBACK_TOKEN` is not used by the exact CPX receiver because callbacks are validated through CPX’s source-IP allowlist and `MD5(trans_id-app_secure_hash)`.

PayPal API credentials are not required for the current publisher payout mode. Automatic PayPal API dispatch is disabled. Publisher payment is completed outside the API after owner review and then recorded with a payment reference.

Do not enable the managed network merely because the CPX secret is present.

## 4. GitHub secrets for InfinityFree

In GitHub → RewardBridge → Settings → Secrets and variables → Actions:

```text
INFINITYFREE_FTP_USERNAME
INFINITYFREE_FTP_PASSWORD
```

Use the rotated InfinityFree password. The staging workflow uploads through FTPS to `/htdocs` and does not perform a clean-slate deletion.

Build-only workflow:

1. Open Actions → Build InfinityFree upload package.
2. Run the workflow.
3. Download `RewardBridge-InfinityFree-upload`.

Direct staging workflow:

1. Open Actions → Stage RewardBridge on InfinityFree.
2. Run the workflow.
3. Enter `DEPLOY` exactly.
4. Verify `https://rewardbridge.freehosting.dev/` without changing Supabase’s active Site URL.

## 5. GitHub secrets for the existing Worker

Create:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

The token should be restricted to the necessary Workers Scripts deployment permission for the correct Cloudflare account.

Worker deployment:

1. Review `cloudflare/merged-worker.js`.
2. Open Actions → Deploy merged misty-mode Worker.
3. Enter `DEPLOY-MERGED-WORKER` exactly.
4. Confirm the workflow smoke-tests the GamePix routes, ads.txt, and RewardBridge routes.

Do not deploy `cloudflare/rewardbridge-routes.js` by itself.

## 6. CPX App 34813

Active site:

```text
https://6028ef2dad7c557eb4.v2.appdeploy.ai/
```

Exact reward settings:

```text
Currency Name (Singular): Reward Credit
Currency Name (Plural): Reward Credits
Currency Factor: 0.45
Currency Decimal Places: 2
Currency Factor for Bonus: 1.00
Bonus Decimal Places: 2
```

Exact postback and survey API contract: `setup/CPX_APP_34813.md`.

Before managed publisher traffic is enabled, verify:

- the CPX test postback is accepted
- the callback source IP and hash pass validation
- a screen-out creates no payable transaction
- a completion creates pending entries only
- a later status-2 callback creates a compensating reversal
- survey results use the actual end-user IP and user agent

## 7. Publisher payout operation

Publisher payout review is already configured:

```text
Automatic review threshold: $25.00 cleared publisher balance
Payment execution mode: owner-confirmed
One active publisher payout review per publisher
```

No separate publisher withdrawal request is used.

For each payout:

1. Verify the submitted PayPal destination in the owner dashboard.
2. Review the publisher, balance, CPX clearing evidence, reversals, account status, and risk signals.
3. Approve the payout in RewardBridge.
4. Complete the PayPal payment using the verified destination.
5. Enter the PayPal transaction/reference value and select Record paid.
6. Do not record payment until PayPal confirms the payment was sent.

When payment fails or review is rejected, enter an internal reason. RewardBridge releases the held funds through compensating ledger entries and pauses further publisher payout review until the issue is resolved and payouts are resumed.

Detailed procedure: `setup/PUBLISHER_PAYOUT_WORKFLOW.md`.

## 8. Controlled launch evidence

Before enabling managed publisher traffic, complete a low-value controlled test covering:

1. Publisher application and approval.
2. Project creation and approval.
3. Project API-key generation.
4. End-user mapping and survey-session creation.
5. CPX survey completion callback.
6. Provider cash-receipt reconciliation.
7. Automatic publisher payout review at $25.
8. Destination verification and owner approval.
9. Payment completion and payment-reference recording.
10. Reversal and failed-payment handling.

## 9. Production switch to InfinityFree

Only after the staged site, Magic Links, legal pages, Worker status route, mobile layout, publisher dashboard, and survey portal are verified:

1. Change Supabase Auth Site URL to `https://rewardbridge.freehosting.dev/`.
2. Run the owner-only `admin_set_platform_urls` function to set InfinityFree as `active_site_url`.
3. Re-test Magic Links and hosted survey-session return URLs.
4. Keep AppDeploy available as rollback until the new host remains stable.
