// Tipos de las respuestas del Worker (son las de OpenWeather, con units=metric y lang=es).
// Solo se tipan los campos que usa la app.

export interface WeatherCondition {
  id: number;
  /** Grupo en inglés: "Clear", "Clouds", "Rain"... */
  main: string;
  /** Descripción en castellano */
  description: string;
  /** Código de ícono, termina en "d" (día) o "n" (noche) */
  icon: string;
}

export interface CurrentWeather {
  name: string;
  coord: { lat: number; lon: number };
  weather: WeatherCondition[];
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  /** Metros; OpenWeather a veces lo omite */
  visibility?: number;
  /** m/s; gust solo viene cuando hay ráfagas */
  wind: { speed: number; deg?: number; gust?: number };
  /** Nubosidad en % */
  clouds?: { all: number };
  sys: { country?: string; sunrise: number; sunset: number };
  /** Desplazamiento respecto de UTC, en segundos */
  timezone: number;
  dt: number;
}

export interface ForecastItem {
  dt: number;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
  };
  weather: WeatherCondition[];
  /** Probabilidad de precipitación, de 0 a 1 */
  pop?: number;
}

export interface Forecast {
  list: ForecastItem[];
  city: { timezone: number };
}

/** Resultado de /api/geocode (Geocoding API de OpenWeather) */
export interface GeocodeResult {
  name: string;
  local_names?: Record<string, string>;
  lat: number;
  lon: number;
  country: string;
  state?: string;
}

/** Clima actual + pronóstico de una misma ubicación */
export interface WeatherData {
  current: CurrentWeather;
  forecast: Forecast;
}

export type WeatherQuery = { city: string } | { lat: number; lon: number };
