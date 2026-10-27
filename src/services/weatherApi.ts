import type { GeocodeResult, WeatherData, WeatherQuery } from '../types/weather';

// La API key vive en el Worker de Cloudflare (worker/), nunca en el frontend.
export const API_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:8787'
  : 'https://weather-world-api.juantrezza.workers.dev';

const CACHE_TTL = 10 * 60 * 1000; // 10 min en ms
const climaCache = new Map<string, WeatherData & { ts: number }>();

/** Error con mensaje para el usuario. `reintentable` = vale la pena ofrecer "Reintentar" (red o 503). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly reintentable = false,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Pide un endpoint del Worker y traduce los errores HTTP a mensajes para el usuario */
export async function pedirAPI<T>(
  endpoint: 'weather' | 'forecast' | 'geocode',
  params: Record<string, string | number>,
  signal: AbortSignal,
  errorGeneral: string,
): Promise<T> {
  const query = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/${endpoint}?${query}`, { signal });
  } catch (error) {
    if (signal.aborted) throw error; // cancelación intencional: la ignora quien llamó
    throw new ApiError('No se pudo conectar. Revisá tu conexión e intentá de nuevo.', true);
  }

  if (!res.ok) {
    if (res.status === 404) throw new ApiError('Ciudad no encontrada. Verificá el nombre.');
    if (res.status === 429) throw new ApiError('Demasiadas búsquedas. Esperá un minuto e intentá de nuevo.');
    if (res.status === 503) throw new ApiError('Servicio no disponible, probá más tarde.', true);
    throw new ApiError(errorGeneral);
  }

  return res.json() as Promise<T>;
}

const redondear4 = (n: number) => Math.round(n * 1e4) / 1e4;

function claveCache(query: WeatherQuery): string {
  return 'city' in query ? query.city.trim().toLowerCase() : `${query.lat.toFixed(2)},${query.lon.toFixed(2)}`;
}

/** Datos en caché (menos de 10 min), o null. Es sincrónico para no mostrar el loading en un acierto. */
export function leerCache(query: WeatherQuery): WeatherData | null {
  const cached = climaCache.get(claveCache(query));
  if (!cached || Date.now() - cached.ts >= CACHE_TTL) return null;
  return { current: cached.current, forecast: cached.forecast };
}

/** Clima actual + pronóstico desde el Worker; guarda el resultado en la caché */
export async function obtenerClima(query: WeatherQuery, signal: AbortSignal): Promise<WeatherData> {
  const porCiudad = 'city' in query;
  // El GPS da 14+ decimales: con 4 (~11 m) alcanza, y ubicaciones casi iguales comparten la caché del Worker
  const params: Record<string, string | number> = porCiudad
    ? { city: query.city }
    : { lat: redondear4(query.lat), lon: redondear4(query.lon) };
  const errorGeneral = porCiudad
    ? 'Error al obtener el clima. Intentá de nuevo.'
    : 'No se pudo obtener el clima de tu ubicación.';

  const current = await pedirAPI<WeatherData['current']>('weather', params, signal, errorGeneral);
  // Petición al pronóstico de 5 días
  const forecast = await pedirAPI<WeatherData['forecast']>('forecast', params, signal, errorGeneral);

  climaCache.set(claveCache(query), { current, forecast, ts: Date.now() });
  return { current, forecast };
}

const geocodeCache = new Map<string, GeocodeResult[]>();

/** Ciudades que coinciden con el texto (hasta 5), para el autocompletado. Caché en memoria por texto. */
export async function buscarCiudades(texto: string, signal: AbortSignal): Promise<GeocodeResult[]> {
  const clave = texto.trim().toLowerCase();
  const cached = geocodeCache.get(clave);
  if (cached) return cached;

  const resultados = await pedirAPI<GeocodeResult[]>('geocode', { q: clave, limit: 5 }, signal, 'No se pudieron buscar ciudades.');
  geocodeCache.set(clave, resultados);
  return resultados;
}
