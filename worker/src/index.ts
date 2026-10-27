import { validateGeocode, validateLocation, type Location, type Result } from './validate';

const OPENWEATHER_URL = 'https://api.openweathermap.org';
const UPSTREAM_TIMEOUT_MS = 10_000;
const WEATHER_TTL_S = 10 * 60;
const GEOCODE_TTL_S = 24 * 60 * 60;

const MSG = {
  notFound: 'Ciudad no encontrada.',
  unavailable: 'Servicio no disponible, probá más tarde.',
  upstream: 'No se pudo obtener el clima en este momento. Probá de nuevo.',
  rateLimit: 'Demasiados pedidos. Esperá un minuto y probá de nuevo.',
  config: 'El servicio no está configurado correctamente.',
} as const;

type Cors = Record<string, string>;

/** Validated request, ready to send to OpenWeather (without the key). */
type Upstream = { path: string; params: Record<string, string>; ttl: number };

const ROUTES: Record<string, (params: URLSearchParams) => Result<Upstream>> = {
  '/api/weather': (params) => forLocation('/data/2.5/weather', validateLocation(params)),
  '/api/forecast': (params) => forLocation('/data/2.5/forecast', validateLocation(params)),
  '/api/geocode': (params) => {
    const parsed = validateGeocode(params);
    if (!parsed.ok) return parsed;
    return {
      ok: true,
      value: {
        path: '/geo/1.0/direct',
        params: { q: parsed.value.q, limit: String(parsed.value.limit) },
        ttl: GEOCODE_TTL_S,
      },
    };
  },
};

export default {
  async fetch(request, env, ctx): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
    const cors = origin && allowed.includes(origin) ? corsHeaders(origin) : null;

    const route = ROUTES[url.pathname];
    if (!route) return json({ error: 'No encontrado.' }, 404, cors);

    // Only the allowed frontends may call the API. Browsers enforce CORS; this also
    // rejects casual non-browser calls that don't send an allowed Origin.
    if (!cors) return json({ error: 'Origen no permitido.' }, 403, null);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          ...cors,
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    if (request.method !== 'GET') {
      return json({ error: 'Método no permitido.' }, 405, { ...cors, Allow: 'GET, OPTIONS' });
    }

    const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
    const { success } = await env.RATE_LIMITER.limit({ key: `api:${ip}` });
    if (!success) return json({ error: MSG.rateLimit }, 429, { ...cors, 'Retry-After': '60' });

    const parsed = route(url.searchParams);
    if (!parsed.ok) return json({ error: parsed.error }, 400, cors);

    if (!env.OPENWEATHER_API_KEY) {
      console.error('OPENWEATHER_API_KEY no está configurada');
      return json({ error: MSG.config }, 500, cors);
    }

    return proxy(parsed.value, url, env, ctx, cors);
  },
} satisfies ExportedHandler<Env>;

async function proxy(
  req: Upstream,
  url: URL,
  env: Env,
  ctx: ExecutionContext,
  cors: Cors,
): Promise<Response> {
  // The cache key only holds the normalized params, never the API key.
  const query = new URLSearchParams(req.params).toString();
  const cacheKey = new Request(`${url.origin}${url.pathname}?${query}`);
  const cache = caches.default;

  const cached = await cache.match(cacheKey);
  if (cached) return withCors(cached, cors, 'HIT');

  const upstreamUrl = `${OPENWEATHER_URL}${req.path}?${query}&appid=${encodeURIComponent(env.OPENWEATHER_API_KEY)}`;
  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, { signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  } catch (err) {
    // Log the error name/message only: the URL carries the key.
    console.error('OpenWeather fetch failed', req.path, err instanceof Error ? err.name : 'unknown');
    return json({ error: MSG.upstream }, 502, cors);
  }

  if (!upstream.ok) {
    // Log status and body for debugging; never forward them to the client.
    console.error('OpenWeather error', req.path, upstream.status, (await upstream.text().catch(() => '')).slice(0, 300));
    if (upstream.status === 404) return json({ error: MSG.notFound }, 404, cors);
    if (upstream.status === 401 || upstream.status === 429) return json({ error: MSG.unavailable }, 503, cors);
    return json({ error: MSG.upstream }, 502, cors);
  }

  const body = await upstream.text();
  const response = new Response(body, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': `public, max-age=${req.ttl}`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return withCors(response, cors, 'MISS');
}

function forLocation(path: string, location: Result<Location>): Result<Upstream> {
  if (!location.ok) return location;
  // units/lang are fixed here so the client can't change them.
  return { ok: true, value: { path, params: { ...location.value, units: 'metric', lang: 'es' }, ttl: WEATHER_TTL_S } };
}

function withCors(response: Response, cors: Cors, cacheStatus: 'HIT' | 'MISS'): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(cors)) headers.set(name, value);
  headers.set('X-Cache', cacheStatus);
  return new Response(response.body, { status: response.status, headers });
}

function corsHeaders(origin: string): Cors {
  return { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' };
}

function json(data: unknown, status: number, headers: Cors | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...(headers ?? { Vary: 'Origin' }),
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
