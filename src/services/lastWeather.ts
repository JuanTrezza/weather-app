import type { WeatherData } from '../types/weather';

const STORAGE_KEY = 'weatherUltimo';

/** Último clima consultado con éxito, para mostrarlo sin conexión */
export interface ClimaGuardado extends WeatherData {
  nombre: string;
  /** Cuándo se consultó (ms desde epoch) */
  fecha: number;
}

export function guardarUltimo(clima: ClimaGuardado): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clima));
  } catch {
    // Sin localStorage (o lleno): no hay respaldo sin conexión, la app sigue funcionando
  }
}

export function leerUltimo(): ClimaGuardado | null {
  try {
    const guardado: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!guardado || typeof guardado !== 'object') return null;
    const c = guardado as Partial<ClimaGuardado>;
    // Validación mínima de forma: lo que necesitan las pantallas para no romperse
    const valido =
      typeof c.nombre === 'string' &&
      typeof c.fecha === 'number' &&
      typeof c.current?.main?.temp === 'number' &&
      Array.isArray(c.current.weather) &&
      Array.isArray(c.forecast?.list);
    return valido ? (c as ClimaGuardado) : null;
  } catch {
    return null;
  }
}

/** "14:05" en la hora del dispositivo */
export const horaConsulta = (ms: number) =>
  new Date(ms).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
