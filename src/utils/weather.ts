import type { ForecastItem } from '../types/weather';
import { fechaLocal } from './time';

/** Convierte grados azimutales a punto cardinal */
export function dirViento(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(deg / 45) % 8]!;
}

const ICONOS: Record<string, string> = {
  clear: '☀️',
  clouds: '☁️',
  rain: '🌧️',
  drizzle: '🌦️',
  thunderstorm: '⛈️',
  snow: '❄️',
  mist: '🌫️',
  fog: '🌫️',
  haze: '🌫️',
  smoke: '🌫️',
  dust: '🌪️',
  tornado: '🌪️',
};

export function obtenerIcono(condicion: string, esNoche: boolean): string {
  if (esNoche) return '🌙';
  return ICONOS[condicion] ?? '🌤️';
}

export type Tema = 'tema-sol' | 'tema-nublado' | 'tema-lluvia' | 'tema-tormenta' | 'tema-nieve' | 'tema-noche';

const TEMAS: Record<string, Tema> = {
  clear: 'tema-sol',
  clouds: 'tema-nublado',
  rain: 'tema-lluvia',
  drizzle: 'tema-lluvia',
  thunderstorm: 'tema-tormenta',
  snow: 'tema-nieve',
};

/** Clase que va en <body> según el clima; null = fondo espacial por defecto */
export function obtenerTema(condicion: string, esNoche: boolean): Tema | null {
  if (esNoche) return 'tema-noche';
  return TEMAS[condicion] ?? null;
}

/** Pronóstico 5 días: un item por día (hora local de la ciudad), el más cercano al mediodía */
export function agruparPorDia(list: ForecastItem[], tzOffsetSec: number): ForecastItem[] {
  const horaDe = (item: ForecastItem) => fechaLocal(item.dt, tzOffsetSec).getUTCHours();
  const diasUnicos = new Map<string, ForecastItem>();

  for (const item of list) {
    const d = fechaLocal(item.dt, tzOffsetSec);
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    const actual = diasUnicos.get(key);
    if (!actual || Math.abs(horaDe(item) - 12) < Math.abs(horaDe(actual) - 12)) {
      diasUnicos.set(key, item);
    }
  }

  return [...diasUnicos.values()].slice(0, 5);
}
