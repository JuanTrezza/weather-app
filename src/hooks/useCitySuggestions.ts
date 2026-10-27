import { useEffect, useState } from 'react';
import { buscarCiudades } from '../services/weatherApi';
import type { GeocodeResult } from '../types/weather';
import { sinDuplicados } from '../utils/places';

const DEBOUNCE_MS = 300;
const MIN_CARACTERES = 2;

export type EstadoSugerencias = 'inactivo' | 'cargando' | 'listo' | 'error';

/**
 * Sugerencias de ciudades para el autocompletado: espera 300 ms sin tipear, pide desde 2 caracteres
 * y cancela el pedido anterior. Con `activo` en false no pide nada (por ejemplo, mientras se busca el clima).
 */
export function useCitySuggestions(texto: string, activo = true) {
  const [sugerencias, setSugerencias] = useState<GeocodeResult[]>([]);
  const [estado, setEstado] = useState<EstadoSugerencias>('inactivo');
  const consulta = texto.trim();
  const habilitado = activo && consulta.length >= MIN_CARACTERES;

  useEffect(() => {
    if (!habilitado) {
      setSugerencias([]);
      setEstado('inactivo');
      return;
    }

    const controller = new AbortController();
    setEstado('cargando');
    const timeout = setTimeout(async () => {
      try {
        const resultados = await buscarCiudades(consulta, controller.signal);
        if (controller.signal.aborted) return;
        setSugerencias(sinDuplicados(resultados));
        setEstado('listo');
      } catch {
        // Cancelado por otra tecla, o error de red/rate limit: sin sugerencias (el buscador sigue funcionando)
        if (controller.signal.aborted) return;
        setSugerencias([]);
        setEstado('error');
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [consulta, habilitado]);

  return { sugerencias, estado };
}
