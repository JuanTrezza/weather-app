import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, leerCache, obtenerClima } from '../services/weatherApi';
import type { WeatherData, WeatherQuery } from '../types/weather';

export interface ErrorClima {
  mensaje: string;
  /** Error de red o 503: tiene sentido ofrecer "Reintentar" */
  reintentable: boolean;
}

interface Opciones {
  /** query = lo que se pidió (nombre o lat/lon), para guardarlo en el historial */
  onExito: (data: WeatherData, query: WeatherQuery) => void;
  onError: (error: ErrorClima) => void;
}

function mensajeGeolocalizacion(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'No diste permiso para usar tu ubicación. Habilitalo en la configuración del navegador o buscá una ciudad.';
    case error.POSITION_UNAVAILABLE:
      return 'No se pudo determinar tu ubicación. Revisá que la ubicación del dispositivo esté activada.';
    case error.TIMEOUT:
      return 'Obtener tu ubicación tardó demasiado. Intentá de nuevo.';
    default:
      return 'No se pudo obtener tu ubicación.';
  }
}

/** Búsqueda de clima por ciudad o por ubicación, cancelando el pedido anterior si sigue en vuelo */
export function useWeather({ onExito, onError }: Opciones) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [cargando, setCargando] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const ultimaConsulta = useRef<WeatherQuery | null>(null);

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
    ultimaConsulta.current = query;

    const exito = (resultado: WeatherData) => {
      setCargando(false);
      setData(resultado);
      callbacks.current.onExito(resultado, query);
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
      callbacks.current.onError({
        mensaje: error instanceof Error ? error.message : 'Error al obtener el clima. Intentá de nuevo.',
        reintentable: error instanceof ApiError && error.reintentable,
      });
    }
  }, []);

  const buscarCiudad = useCallback((ciudad: string) => buscar({ city: ciudad }), [buscar]);
  const buscarCoordenadas = useCallback((lat: number, lon: number) => buscar({ lat, lon }), [buscar]);

  const buscarUbicacion = useCallback(() => {
    if (!navigator.geolocation) {
      callbacks.current.onError({ mensaje: 'Tu navegador no soporta geolocalización.', reintentable: false });
      return;
    }

    setCargando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => void buscar({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (error) => {
        setCargando(false);
        callbacks.current.onError({ mensaje: mensajeGeolocalizacion(error), reintentable: false });
      },
      // 10 s como máximo; sirve una ubicación de hasta 5 minutos atrás (más rápido, y el clima no cambia por eso)
      { timeout: 10_000, maximumAge: 5 * 60_000 },
    );
  }, [buscar]);

  /** Repite la última consulta (después de un error de red o 503) */
  const reintentar = useCallback(() => {
    if (ultimaConsulta.current) void buscar(ultimaConsulta.current);
  }, [buscar]);

  return { data, cargando, buscarCiudad, buscarCoordenadas, buscarUbicacion, reintentar };
}
