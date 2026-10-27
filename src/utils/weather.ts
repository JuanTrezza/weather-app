import type { ForecastItem, WeatherCondition } from '../types/weather';
import { fechaLocal } from './time';

/** Convierte grados azimutales a punto cardinal */
export function dirViento(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(deg / 45) % 8]!;
}

/** m/s (lo que devuelve la API con units=metric) → km/h */
export const aKmh = (ms: number) => Math.round(ms * 3.6);

export type Cielo = 'despejado' | 'parcial' | 'nubes' | 'llovizna' | 'lluvia' | 'tormenta' | 'nieve' | 'niebla';

/** Agrupa las condiciones de OpenWeather (https://openweathermap.org/weather-conditions) */
export function tipoCielo(condicion: WeatherCondition | undefined): Cielo {
  if (!condicion) return 'nubes';
  const id = condicion.id;
  if (id >= 200 && id < 300) return 'tormenta';
  if (id >= 300 && id < 400) return 'llovizna';
  if (id >= 500 && id < 600) return 'lluvia';
  if (id >= 600 && id < 700) return 'nieve';
  if (id >= 700 && id < 800) return 'niebla';
  if (id === 800) return 'despejado';
  if (id === 801 || id === 802) return 'parcial';
  return 'nubes';
}

export interface DiaPronostico {
  dt: number;
  esHoy: boolean;
  min: number;
  max: number;
  cielo: Cielo;
  descripcion: string;
}

/**
 * Pronóstico por día (hora local de la ciudad): mínima y máxima de todos los tramos de 3 h
 * del día, e ícono del tramo más cercano al mediodía. `tempActual` se suma al día de hoy.
 */
export function resumenDiario(
  list: ForecastItem[],
  tzOffsetSec: number,
  tempActual?: number,
  dias = 5,
): DiaPronostico[] {
  const claveDia = (unixSec: number) => {
    const d = fechaLocal(unixSec, tzOffsetSec);
    return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
  };
  const distMediodia = (item: ForecastItem) => Math.abs(fechaLocal(item.dt, tzOffsetSec).getUTCHours() - 12);
  const hoy = claveDia(Math.floor(Date.now() / 1000));

  const porDia = new Map<string, { items: ForecastItem[]; central: ForecastItem }>();
  for (const item of list) {
    const key = claveDia(item.dt);
    const dia = porDia.get(key);
    if (!dia) porDia.set(key, { items: [item], central: item });
    else {
      dia.items.push(item);
      if (distMediodia(item) < distMediodia(dia.central)) dia.central = item;
    }
  }

  return [...porDia.entries()].slice(0, dias).map(([key, { items, central }]) => {
    const temps = items.flatMap((i) => [i.main.temp_min, i.main.temp_max]);
    const esHoy = key === hoy;
    if (esHoy && tempActual !== undefined) temps.push(tempActual);
    return {
      dt: central.dt,
      esHoy,
      min: Math.min(...temps),
      max: Math.max(...temps),
      cielo: tipoCielo(central.weather[0]),
      descripcion: central.weather[0]?.description ?? '',
    };
  });
}
