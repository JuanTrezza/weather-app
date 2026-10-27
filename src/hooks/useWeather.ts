import { useCallback, useEffect, useRef, useState } from 'react';
import { leerCache, obtenerClima } from '../services/weatherApi';
import type { WeatherData, WeatherQuery } from '../types/weather';

interface Opciones {
  onExito: (data: WeatherData) => void;
  onError: (mensaje: string) => void;
}

/** Búsqueda de clima por ciudad o por ubicación, cancelando el pedido anterior si sigue en vuelo */
export function useWeather({ onExito, onError }: Opciones) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [cargando, setCargando] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Los callbacks se leen de un ref para que buscar() no cambie en cada render
  const callbacks = useRef({ onExito, onError });
  useEffect(() => {
    callbacks.current = { onExito, onError };
  });

  // Al desmontar, cancelamos lo que quede en vuelo
  useEffect(() => () => abortRef.current?.abort(), []);

  const buscar = useCallback(async (query: WeatherQuery) => {
    // Cancelar petición anterior si aún está en vuelo
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const exito = (resultado: WeatherData) => {
      setCargando(false);
      setData(resultado);
      callbacks.current.onExito(resultado);
    };

    const cached = leerCache(query);
    if (cached) return exito(cached);

    setCargando(true);
    try {
      const resultado = await obtenerClima(query, controller.signal);
      if (!controller.signal.aborted) exito(resultado);
    } catch (error) {
      if (controller.signal.aborted) return; // petición cancelada intencionalmente
      setCargando(false);
      callbacks.current.onError(error instanceof Error ? error.message : 'Error al obtener el clima. Intentá de nuevo.');
    }
  }, []);

  const buscarCiudad = useCallback((ciudad: string) => buscar({ city: ciudad }), [buscar]);

  const buscarUbicacion = useCallback(() => {
    if (!navigator.geolocation) {
      callbacks.current.onError('Tu navegador no soporta geolocalización.');
      return;
    }

    setCargando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => void buscar({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {
        setCargando(false);
        callbacks.current.onError('No se pudo obtener tu ubicación. Permití el acceso.');
      },
    );
  }, [buscar]);

  return { data, cargando, buscarCiudad, buscarUbicacion };
}
