const REWARDBRIDGE_STATUS_URL = 'https://fmywfaffczulebozlpsx.supabase.co/functions/v1/platform-status';
const ALLOWED_ORIGINS = new Set([
  'https://6028ef2dad7c557eb4.v2.appdeploy.ai',
  'https://rewardbridge.freehosting.dev',
]);

function corsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : 'https://6028ef2dad7c557eb4.v2.appdeploy.ai',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  };
}

export async function handleRewardBridgeRequest(request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/rewardbridge/')) return null;

  const headers = corsHeaders(request);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'GET') {
    return Response.json({ error: 'method_not_allowed' }, { status: 405, headers });
  }

  if (url.pathname === '/rewardbridge/health') {
    return Response.json({
      ok: true,
      service: 'rewardbridge-route-adapter',
      managedNetworkEnabled: false,
    }, { status: 200, headers: { ...headers, 'Cache-Control': 'no-store' } });
  }

  if (url.pathname === '/rewardbridge/api/platform-status') {
    try {
      const upstream = await fetch(REWARDBRIDGE_STATUS_URL, {
        headers: { Accept: 'application/json' },
        cf: { cacheTtl: 60, cacheEverything: true },
      });
      const body = await upstream.text();
      return new Response(body, {
        status: upstream.status,
        headers: {
          ...headers,
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        },
      });
    } catch {
      return Response.json({
        managedNetworkEnabled: false,
        publisherPayoutMinimum: 25,
        userPayoutFloor: 2,
        activation: 'CPX approval required',
      }, { status: 503, headers: { ...headers, 'Cache-Control': 'no-store' } });
    }
  }

  return Response.json({ error: 'not_found' }, { status: 404, headers });
}
