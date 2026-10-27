import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'weatherHistorial';
const MAX_CIUDADES = 5;

/** Ciudad buscada. Las entradas viejas (antes del autocompletado) solo tienen nombre. */
export interface CiudadGuardada {
  nombre: string;
  /** Código ISO del país */
  pais?: string;
  lat?: number;
  lon?: number;
}

const tieneCoordenadas = (c: CiudadGuardada): c is CiudadGuardada & { lat: number; lon: number } =>
  typeof c.lat === 'number' && typeof c.lon === 'number';

/** Misma ciudad: por coordenadas (≈1 km) si las hay; si no, por nombre */
function mismaCiudad(a: CiudadGuardada, b: CiudadGuardada): boolean {
  if (tieneCoordenadas(a) && tieneCoordenadas(b)) {
    return Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lon - b.lon) < 0.01;
  }
  return a.nombre.toLowerCase() === b.nombre.toLowerCase();
}

/** Acepta el formato nuevo (objetos) y el viejo (solo nombres, ["Rosario", ...]) */
function migrar(item: unknown): CiudadGuardada | null {
  if (typeof item === 'string') return item.trim() ? { nombre: item } : null;
  if (!item || typeof item !== 'object') return null;
  const { nombre, pais, lat, lon } = item as Record<string, unknown>;
  if (typeof nombre !== 'string' || !nombre.trim()) return null;
  return {
    nombre,
    ...(typeof pais === 'string' && { pais }),
    ...(typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon) && { lat, lon }),
  };
}

function leerHistorial(): CiudadGuardada[] {
  try {
    const guardado: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(guardado)) return [];
    return guardado.map(migrar).filter((c): c is CiudadGuardada => c !== null).slice(0, MAX_CIUDADES);
  } catch {
    // JSON roto o localStorage bloqueado: arrancamos sin historial
    return [];
  }
}

/** Últimas ciudades buscadas (máximo 5), persistidas en localStorage */
export function useHistory() {
  const [historial, setHistorial] = useState<CiudadGuardada[]>(leerHistorial);

  // Se guarda siempre en el formato nuevo, así el historial viejo queda migrado
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historial));
    } catch {
      // Sin localStorage el historial dura solo la sesión
    }
  }, [historial]);

  const agregar = useCallback((ciudad: CiudadGuardada) => {
    // Quitamos si ya existía (también la versión vieja, solo con nombre) y la agregamos al principio
    setHistorial((prev) =>
      [
        ciudad,
        ...prev.filter(
          (c) => !mismaCiudad(c, ciudad) && !(!tieneCoordenadas(c) && c.nombre.toLowerCase() === ciudad.nombre.toLowerCase()),
        ),
      ].slice(0, MAX_CIUDADES),
    );
  }, []);

  return { historial, agregar };
}

export { tieneCoordenadas };
