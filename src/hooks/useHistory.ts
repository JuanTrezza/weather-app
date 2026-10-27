import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'weatherHistorial';
const MAX_CIUDADES = 5;

function leerHistorial(): string[] {
  try {
    const guardado: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(guardado)) return [];
    return guardado.filter((c): c is string => typeof c === 'string').slice(0, MAX_CIUDADES);
  } catch {
    // JSON roto o localStorage bloqueado: arrancamos sin historial
    return [];
  }
}

/** Últimas ciudades buscadas (máximo 5), persistidas en localStorage */
export function useHistory() {
  const [historial, setHistorial] = useState<string[]>(leerHistorial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historial));
    } catch {
      // Sin localStorage el historial dura solo la sesión
    }
  }, [historial]);

  const agregar = useCallback((ciudad: string) => {
    // Quitamos si ya existía para no duplicar y la agregamos al principio
    setHistorial((prev) =>
      [ciudad, ...prev.filter((c) => c.toLowerCase() !== ciudad.toLowerCase())].slice(0, MAX_CIUDADES),
    );
  }, []);

  return { historial, agregar };
}
