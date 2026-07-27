# RewardBridge routes for the existing Worker

The requested Worker currently serves the Crimson Forge browser-games surface. Do not replace its entire script with RewardBridge code.

Merge `rewardbridge-routes.js` into the existing Worker and call it before the existing route switch:

```js
import { handleRewardBridgeRequest } from './rewardbridge-routes.js';

export default {
  async fetch(request, env, ctx) {
    const rewardBridgeResponse = await handleRewardBridgeRequest(request);
    if (rewardBridgeResponse) return rewardBridgeResponse;

    // Continue into the existing Crimson Forge games, ads.txt and health routes.
    return handleExistingCrimsonForgeRequest(request, env, ctx);
  },
};
```

Prepared routes:

- `GET /rewardbridge/health`
- `GET /rewardbridge/api/platform-status`

The adapter contains no provider or database secret. It proxies only the public Supabase `platform-status` Edge Function and uses a fail-closed response if the upstream is unavailable.

Do not deploy this directory by itself to `misty-mode-a1d4`; doing so would remove the existing GamePix and ads.txt behavior. A merged source or the original Worker source is required first.
