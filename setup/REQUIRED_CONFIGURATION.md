# Required configuration before live launch

## 1. Rotate the exposed InfinityFree password

The InfinityFree screenshot exposed the current hosting password. Change it before using FTP or GitHub Actions. Do not reuse the old value.

## 2. Supabase Auth URLs

In Supabase Dashboard → Authentication → URL Configuration:

- Site URL: `https://6028ef2dad7c557eb4.v2.appdeploy.ai/`
- Redirect URL: `https://6028ef2dad7c557eb4.v2.appdeploy.ai/**`
- Redirect URL: `https://rewardbridge.freehosting.dev/**`

Keep AppDeploy as the active Site URL until InfinityFree is fully staged and tested.

## 3. Supabase Edge Function secrets

In Supabase Dashboard → Edge Functions → Secrets, add only after CPX and PayPal provide the values:

```text
CPX_APP_ID
CPX_SECURE_HASH
CPX_POSTBACK_TOKEN
PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET
PAYPAL_MODE=sandbox
```

Do not enable the managed network merely because secrets were added.

## 4. GitHub secrets for InfinityFree

In GitHub → RewardBridge → Settings → Secrets and variables → Actions, create:

```text
INFINITYFREE_FTP_USERNAME
INFINITYFREE_FTP_PASSWORD
```

Use the rotated InfinityFree password. The workflow uploads through FTPS to `/htdocs` and does not perform a clean-slate deletion.

Build-only workflow:

1. Open Actions → Build InfinityFree upload package.
2. Run workflow.
3. Download `RewardBridge-InfinityFree-upload`.

Direct staging workflow:

1. Open Actions → Stage RewardBridge on InfinityFree.
2. Run workflow.
3. Enter `DEPLOY` exactly.
4. Verify `https://rewardbridge.freehosting.dev/` without changing Supabase’s active site setting.

## 5. GitHub secrets for the existing Worker

Create:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

The token should be limited to the required Workers Scripts deployment permission for the correct Cloudflare account.

Worker deployment:

1. Review `cloudflare/merged-worker.js`.
2. Open Actions → Deploy merged misty-mode Worker.
3. Enter `DEPLOY-MERGED-WORKER` exactly.
4. The workflow validates and smoke-tests the existing GamePix routes, ads.txt, and new RewardBridge routes.

Do not deploy `cloudflare/rewardbridge-routes.js` by itself. It is not a complete Worker.

## 6. CPX application

Use the current active AppDeploy URL during application review:

```text
https://6028ef2dad7c557eb4.v2.appdeploy.ai/
```

Select a web/API integration. Request written approval for the managed distribution-partner structure. Do not enable partner traffic before approval.

Before configuring the postback, capture the exact CPX macros for:

- transaction ID
- external user ID
- publisher payout amount
- status
- reversal indicator or reversal status
- subid_1
- subid_2

## 7. PayPal

Keep `PAYPAL_MODE=sandbox` until all of the following pass:

- verified publisher payout destination
- $25 publisher minimum enforcement
- idempotent batch creation
- successful payment status synchronization
- failed-payment balance restoration
- returned or denied payout handling

## 8. Production switch to InfinityFree

Only after the staged site, Magic Links, legal pages, Worker status route, mobile layout, and portal callback are verified:

1. Change Supabase Auth Site URL to `https://rewardbridge.freehosting.dev/`.
2. Run the owner-only `admin_set_platform_urls` function to set InfinityFree as `active_site_url`.
3. Re-test Magic Links and hosted survey-session return URLs.
4. Keep AppDeploy available as rollback until the new host remains stable.
