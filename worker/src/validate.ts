export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/** Either a city name or a lat/lon pair, already normalized. */
export type Location = { q: string } | { lat: string; lon: string };

const MAX_TEXT = 100;
const MAX_LIMIT = 5;
// Plain decimal numbers with any number of decimals (GPS sends 14+): rejects "", "1e2", "0x10", "Infinity", etc.
const DECIMAL = /^-?\d{1,3}(\.\d+)?$/;
// Generous cap so a huge query string can't reach Number()
const MAX_COORD_LENGTH = 32;

export function validateLocation(params: URLSearchParams): Result<Location> {
  const city = params.get('city');
  const lat = params.get('lat');
  const lon = params.get('lon');

  if (city !== null) {
    if (lat !== null || lon !== null) return fail('Usá city o lat/lon, no ambos.');
    const text = validateText(city, 'city');
    // Lowercased so "Rosario" and "rosario" share the same cache entry.
    return text.ok ? { ok: true, value: { q: text.value.toLowerCase() } } : text;
  }

  if (lat === null || lon === null) return fail('Falta city, o lat y lon.');
  const latNum = parseCoord(lat, 90);
  if (latNum === null) return fail('lat tiene que ser un número entre -90 y 90.');
  const lonNum = parseCoord(lon, 180);
  if (lonNum === null) return fail('lon tiene que ser un número entre -180 y 180.');

  // Rounded to 4 decimals (~11 m) before calling OpenWeather and before building the cache key,
  // so nearly identical locations share the cache.
  return { ok: true, value: { lat: round(latNum), lon: round(lonNum) } };
}

export function validateGeocode(params: URLSearchParams): Result<{ q: string; limit: number }> {
  const q = params.get('q');
  if (q === null) return fail('Falta el parámetro q.');
  const text = validateText(q, 'q');
  if (!text.ok) return text;

  const rawLimit = params.get('limit');
  let limit = MAX_LIMIT;
  if (rawLimit !== null) {
    if (!/^\d{1,2}$/.test(rawLimit) || Number(rawLimit) < 1 || Number(rawLimit) > MAX_LIMIT) {
      return fail(`limit tiene que ser un número entero entre 1 y ${MAX_LIMIT}.`);
    }
    limit = Number(rawLimit);
  }
  return { ok: true, value: { q: text.value.toLowerCase(), limit } };
}

function validateText(raw: string, name: string): Result<string> {
  const value = raw.trim();
  // Count code points so accented names and emoji aren't over-counted.
  const length = [...value].length;
  if (length < 1 || length > MAX_TEXT) {
    return fail(`${name} tiene que tener entre 1 y ${MAX_TEXT} caracteres.`);
  }
  return { ok: true, value };
}

function parseCoord(raw: string, max: number): number | null {
  if (raw.length > MAX_COORD_LENGTH || !DECIMAL.test(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= -max && n <= max ? n : null;
}

function round(n: number): string {
  return String(Math.round(n * 1e4) / 1e4);
}

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}
