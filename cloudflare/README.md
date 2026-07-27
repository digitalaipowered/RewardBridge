# RewardBridge routes on `misty-mode-a1d4`

The existing Worker serves the Crimson Forge browser-games surface. RewardBridge must never replace those routes with a standalone survey Worker.

## Authoritative deployable file

Use `merged-worker.js`. It preserves:

- `/`
- `/health`
- `/ads.txt`
- `/api/games/config`
- `/api/games/launch`
- `/robots.txt`

It adds only:

- `/rewardbridge/`
- `/rewardbridge/health`
- `/rewardbridge/api/health`
- `/rewardbridge/api/platform-status`

The RewardBridge status route proxies the public, read-only Supabase `platform-status` Edge Function and returns a locked fallback when that service is unavailable.

## Deployment guard

`.github/workflows/deploy-worker.yml` is manual-only. It validates the preserved GamePix routes, exact ads.txt property marker, RewardBridge route, and forbidden-secret patterns before deploying. The workflow requires repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Do not paste CPX, PayPal, Supabase service-role, or publisher project secrets into this Worker.

`rewardbridge-routes.js` remains as a small reference adapter. It is not a complete replacement Worker.
