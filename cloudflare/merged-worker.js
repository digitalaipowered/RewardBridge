// misty-mode-a1d4 merged Worker
// Preserves Crimson Forge Browser Games v10.32.14 routes.
// Adds RewardBridge only under /rewardbridge/*.

const VERSION = '10.32.14-review-ready+rewardbridge-0.1.0';
const ROLE = 'browser-games-worker+rewardbridge-gateway';
const DEFAULT_ALLOWED_ORIGIN = 'https://crimsonforge.gamer.gd';
const REWARDBRIDGE_STATUS_URL = 'https://fmywfaffczulebozlpsx.supabase.co/functions/v1/platform-status';
const REWARDBRIDGE_ORIGINS = new Set([
  'https://6028ef2dad7c557eb4.v2.appdeploy.ai',
  'https://rewardbridge.freehosting.dev',
]);

const DEFAULT_GAMEPIX_URLS = Object.freeze({
  home: 'https://www.gamepix.com/',
  puzzle: 'https://www.gamepix.com/games/puzzle/',
  arcade: 'https://www.gamepix.com/games/arcade/',
  sports: 'https://www.gamepix.com/games/sports/',
  mahjong: 'https://www.gamepix.com/games/mahjong/',
});

const GAMEPIX_ADS_TXT_LINES = [
  '#gpx-property-F7FCN',
  '#gpx-last-updated-2024-11-21',
  '#gpx-reviq',
  'rev.iq, Kf077RYmx6XvWT8mhSbYq7LIQTU, DIRECT',
  'google.com, pub-6729046591418183, DIRECT, f08c47fec0942fa0',
  'Media.net, 8CUUN62FF, DIRECT',
  'openx.com, 540447780, DIRECT, 6a698e2ec38604c6',
  'indexexchange.com, 194018, DIRECT, 50b1c356f2c5c8fc',
  'google.com, pub-6672729658077061, DIRECT, f08c47fec0942fa0',
  'google.com, pub-4996167737872209, DIRECT, f08c47fec0942fa0',
  'google.com, pub-4440077550203864, DIRECT, f08c47fec0942fa0',
  'rubiconproject.com, 20474, DIRECT, 0bfd66d529a55807',
  'rubiconproject.com, 20476, DIRECT, 0bfd66d529a55807',
  'appnexus.com, 11995, DIRECT, f5ab79cb980f11d1',
  'pubmatic.com, 158150, DIRECT, 5d62403b186f2ace',
  'pubmatic.com, 160474, DIRECT, 5d62403b186f2ace',
  'google.com, pub-5285623249468085, DIRECT, f08c47fec0942fa0',
  'google.com, pub-8435989769185680, DIRECT, f08c47fec0942fa0',
];
const GAMEPIX_ADS_TXT = `${GAMEPIX_ADS_TXT_LINES.join('\n')}\n`;

function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

function text(payload, status = 200, headers = {}) {
  return new Response(payload, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

function html(payload, status = 200, headers = {}) {
  return new Response(payload, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });
}

function getAllowedOrigins(env = {}) {
  return String(env.CRIMSON_GAMES_ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGIN).split(',').map(value => value.trim()).filter(Boolean);
}

function corsHeaders(request, env = {}) {
  const requestOrigin = request.headers.get('Origin') || '';
  const allowed = getAllowedOrigins(env);
  const origin = allowed.includes(requestOrigin) ? requestOrigin : allowed[0] || DEFAULT_ALLOWED_ORIGIN;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

function rewardBridgeCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  return {
    'Access-Control-Allow-Origin': REWARDBRIDGE_ORIGINS.has(origin) ? origin : 'https://6028ef2dad7c557eb4.v2.appdeploy.ai',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
  };
}

async function handleRewardBridgeRequest(request) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/rewardbridge/')) return null;
  const headers = rewardBridgeCorsHeaders(request);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405, headers);

  if (url.pathname === '/rewardbridge/' || url.pathname === '/rewardbridge/health' || url.pathname === '/rewardbridge/api/health') {
    return json({
      ok: true,
      service: 'rewardbridge-gateway',
      version: VERSION,
      managedNetworkEnabled: false,
      statusEndpoint: '/rewardbridge/api/platform-status',
    }, 200, headers);
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
          'Cache-Control': upstream.ok ? 'public, max-age=60, stale-while-revalidate=300' : 'no-store',
        },
      });
    } catch {
      return json({
        managedNetworkEnabled: false,
        publisherPayoutMinimum: 25,
        userPayoutFloor: 2,
        activation: 'CPX approval required',
      }, 503, headers);
    }
  }

  return json({ error: 'not_found' }, 404, headers);
}

function normalizeTarget(value = '') {
  const target = String(value || 'home').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  return DEFAULT_GAMEPIX_URLS[target] ? target : 'home';
}

function envUrl(env = {}, key = '', fallback = '') {
  return String(env[key] || fallback || '').trim();
}

function getTargetUrl(target = 'home', env = {}) {
  const normalized = normalizeTarget(target);
  const map = {
    home: envUrl(env, 'GAMEPIX_HOME_URL', DEFAULT_GAMEPIX_URLS.home),
    puzzle: envUrl(env, 'GAMEPIX_PUZZLE_URL', DEFAULT_GAMEPIX_URLS.puzzle),
    arcade: envUrl(env, 'GAMEPIX_ARCADE_URL', DEFAULT_GAMEPIX_URLS.arcade),
    sports: envUrl(env, 'GAMEPIX_SPORTS_URL', DEFAULT_GAMEPIX_URLS.sports),
    mahjong: envUrl(env, 'GAMEPIX_MAHJONG_URL', DEFAULT_GAMEPIX_URLS.mahjong),
  };
  return map[normalized] || map.home;
}

function getAllowedRedirectHosts(env = {}) {
  const defaults = ['gamepix.com', 'www.gamepix.com', 'games.gamepix.com', 'play.gamepix.com'];
  const custom = String(env.GAMEPIX_ALLOWED_REDIRECT_HOSTS || '').split(',').map(host => host.trim().toLowerCase()).filter(Boolean);
  return Array.from(new Set([...defaults, ...custom]));
}

function isSafeGamePixUrl(value = '', env = {}) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    return getAllowedRedirectHosts(env).some(allowed => hostname === allowed || hostname.endsWith(`.${allowed}`));
  } catch {
    return false;
  }
}

function getReviewHomeHtml() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Crimson Forge Games</title><meta name="description" content="Crimson Forge browser games powered by GamePix."><style>:root{color-scheme:dark;--bg:#080606;--panel:#14100f;--line:#3a211c;--text:#fff5ed;--muted:#bdaaa0;--hot:#ef4444;--gold:#f59e0b}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at top,#3a1211 0,#080606 44%,#030202 100%);font-family:Arial,Helvetica,sans-serif;color:var(--text);display:flex;align-items:center;justify-content:center;padding:24px}main{width:100%;max-width:680px;background:rgba(20,16,15,.92);border:1px solid var(--line);border-radius:28px;padding:28px;box-shadow:0 24px 80px rgba(0,0,0,.45)}.eyebrow{display:inline-block;border:1px solid #8b3d31;border-radius:999px;padding:9px 16px;color:#ffd1b6;background:#1d100e;text-transform:uppercase;letter-spacing:3px;font-size:12px;font-weight:900}h1{font-size:clamp(36px,9vw,64px);line-height:.95;margin:22px 0 12px;letter-spacing:-2px}p{color:var(--muted);font-size:17px;line-height:1.55;margin:0 0 18px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:22px}a{display:block;text-align:center;text-decoration:none;color:#fff;border:1px solid #4a2823;background:#171111;border-radius:16px;padding:16px;font-weight:900}a.primary{grid-column:1/-1;background:linear-gradient(135deg,#7c2d12,var(--hot),var(--gold));border-color:#cf4a32}.meta{margin-top:22px;border-top:1px solid #2b1a17;padding-top:16px;color:#7f716b;font-size:12px;line-height:1.45}@media(max-width:520px){main{padding:22px;border-radius:22px}.grid{grid-template-columns:1fr}a.primary{grid-column:auto}}</style></head><body><main><span class="eyebrow">Crimson Forge</span><h1>Browser Games</h1><p>Play browser games through the Crimson Forge games surface. This public Worker exists for GamePix traffic and ads.txt validation only.</p><div class="grid"><a class="primary" href="/api/games/launch?target=home">Open GamePix</a><a href="/api/games/launch?target=puzzle">Puzzle</a><a href="/api/games/launch?target=arcade">Arcade</a><a href="/api/games/launch?target=sports">Sports</a><a href="/api/games/launch?target=mahjong">Mahjong</a><a href="/ads.txt">ads.txt</a><a href="/health">Health</a></div><div class="meta">Role: ${ROLE} · Version: ${VERSION} · Rewards disabled · Wallet writes disabled</div></main></body></html>`;
}

async function handleRequest(request, env = {}) {
  const rewardBridgeResponse = await handleRewardBridgeRequest(request);
  if (rewardBridgeResponse) return rewardBridgeResponse;

  const url = new URL(request.url);
  const cors = corsHeaders(request, env);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'GET') return json({ ok: false, error: 'method_not_allowed' }, 405, cors);

  if (url.pathname === '/' || url.pathname === '/index.html') return html(getReviewHomeHtml(), 200, cors);
  if (url.pathname === '/health') return json({
    ok: true,
    version: VERSION,
    role: ROLE,
    propertyId: env.GAMEPIX_PROPERTY_ID || 'F7FCN',
    reviewReady: true,
    publicAccess: true,
    rewardsEnabled: false,
    walletWritesEnabled: false,
    purpose: 'GamePix/browser-games traffic and ads.txt validation with isolated RewardBridge gateway routes.',
    adsTxtEndpoint: '/ads.txt',
    launchEndpoint: '/api/games/launch?target=home',
    rewardBridgeEndpoint: '/rewardbridge/health',
    targets: Object.keys(DEFAULT_GAMEPIX_URLS),
  }, 200, cors);
  if (url.pathname === '/ads.txt') return text(GAMEPIX_ADS_TXT, 200, cors);
  if (url.pathname === '/api/games/config') {
    const origin = url.origin;
    return json({
      ok: true,
      version: VERSION,
      role: ROLE,
      reviewReady: true,
      rewardsEnabled: false,
      walletWritesEnabled: false,
      adsTxtUrl: `${origin}/ads.txt`,
      urls: Object.fromEntries(Object.keys(DEFAULT_GAMEPIX_URLS).map(target => [target, `${origin}/api/games/launch?target=${target}`])),
    }, 200, cors);
  }
  if (url.pathname === '/api/games/launch') {
    const target = normalizeTarget(url.searchParams.get('target') || 'home');
    const destination = getTargetUrl(target, env);
    if (!isSafeGamePixUrl(destination, env)) {
      let destinationHost = '';
      try { destinationHost = new URL(destination).hostname; } catch {}
      return json({ ok: false, error: 'unsafe_gamepix_redirect', target, destinationHost }, 500, cors);
    }
    return new Response(null, { status: 302, headers: { Location: destination, 'Cache-Control': 'no-store', 'Referrer-Policy': 'strict-origin-when-cross-origin', ...cors } });
  }
  if (url.pathname === '/robots.txt') return text('User-agent: *\nAllow: /\nAllow: /ads.txt\nAllow: /api/games/\nAllow: /rewardbridge/\n', 200, cors);
  return json({ ok: false, error: 'not_found', role: ROLE }, 404, cors);
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
