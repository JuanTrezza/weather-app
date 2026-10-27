import { useCallback, useEffect, useRef, useState } from 'react';
import ErrorToast from './components/ErrorToast';
import Globe, { type GloboHandle } from './components/Globe';
import History from './components/History';
import Loading from './components/Loading';
import SearchBar from './components/SearchBar';
import Stars from './components/Stars';
import WeatherScreen from './components/WeatherScreen';
import { tieneCoordenadas, useHistory, type CiudadGuardada } from './hooks/useHistory';
import { useUnit } from './hooks/useUnit';
import { useWeather, type ErrorClima } from './hooks/useWeather';
import type { GeocodeResult, WeatherData, WeatherQuery } from './types/weather';
import { nombreCiudad } from './utils/places';
import { PALETA_INICIO, faseDelDia, paletaPara } from './utils/theme';
import { tipoCielo } from './utils/weather';

type Pantalla = 'busqueda' | 'clima';

export default function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('busqueda');
  const [ciudad, setCiudad] = useState('');
  // id distinto en cada error, para reiniciar el timer aunque el mensaje se repita
  const [error, setError] = useState<(ErrorClima & { id: number }) | null>(null);
  // Mientras el globo gira hacia la ciudad encontrada (antes de mostrar el resultado)
  const [girando, setGirando] = useState(false);
  const [anuncio, setAnuncio] = useState('');
  // Nombre que se muestra: el elegido (sugerencia, historial) o, si se buscó por texto, el de la API
  const [nombreVisible, setNombreVisible] = useState('');
  const { historial, agregar } = useHistory();
  const unit = useUnit();
  const { reiniciar: reiniciarUnidad } = unit;

  const globoRef = useRef<GloboHandle>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Cada búsqueda nueva invalida el giro de la anterior
  const busquedaId = useRef(0);
  // Nombre elegido para la búsqueda en curso (por lat/lon la API puede devolver el de un barrio o estación)
  const nombreElegido = useRef<string | null>(null);

  const mostrarError = useCallback((e: ErrorClima) => {
    setAnuncio('');
    setError({ ...e, id: Date.now() });
  }, []);
  const cerrarError = useCallback(() => setError(null), []);

  const onExito = useCallback(
    async (data: WeatherData, query: WeatherQuery) => {
      const id = busquedaId.current;
      const nombre = nombreElegido.current ?? data.current.name;
      nombreElegido.current = null;
      reiniciarUnidad();
      setNombreVisible(nombre);
      // Se guardan las coordenadas pedidas (si se buscó por lat/lon), así tocar el historial pega en la caché
      const { lat, lon } = 'lat' in query ? query : data.current.coord;
      agregar({ nombre, pais: data.current.sys.country, lat, lon });

      // El globo gira hasta la ciudad antes de mostrar el resultado (sin animación con reduced motion)
      setGirando(true);
      await globoRef.current?.girarHacia(data.current.coord.lat, data.current.coord.lon);
      if (id !== busquedaId.current) return; // llegó otra búsqueda mientras giraba
      setGirando(false);
      window.scrollTo(0, 0);
      setPantalla('clima');
    },
    [reiniciarUnidad, agregar],
  );

  const { data, cargando, buscarCiudad, buscarCoordenadas, buscarUbicacion, reintentar } = useWeather({
    onExito,
    onError: mostrarError,
  });

  // Tema: degradado según el clima y la hora local de la ciudad (variables CSS que transicionan)
  const current = pantalla === 'clima' ? data?.current : undefined;
  const paleta = current ? paletaPara(tipoCielo(current.weather[0]), faseDelDia(current)) : PALETA_INICIO;
  useEffect(() => {
    const raiz = document.documentElement.style;
    raiz.setProperty('--bg-arriba', paleta.arriba);
    raiz.setProperty('--bg-abajo', paleta.abajo);
    raiz.setProperty('--estrellas', String(paleta.estrellas));
  }, [paleta]);

  // Anuncio para lectores de pantalla cuando aparece el resultado
  useEffect(() => {
    if (!current) return;
    const clima = current.weather[0];
    setAnuncio(
      `Clima en ${nombreVisible}: ${unit.conv(current.main.temp)}${unit.unidad === '°' ? ' grados' : ' grados Fahrenheit'}, ${clima?.description ?? ''}.`,
    );
    // Solo al cambiar de ciudad, no al cambiar de unidad
  }, [current, nombreVisible]);

  const empezarBusqueda = () => {
    busquedaId.current++;
    nombreElegido.current = null;
    setGirando(false);
    setError(null);
    setAnuncio('Buscando clima…');
  };

  const buscar = (nombre: string) => {
    if (!nombre) {
      mostrarError({ mensaje: 'Ingresá el nombre de una ciudad.', reintentable: false });
      inputRef.current?.focus();
      return;
    }
    empezarBusqueda();
    void buscarCiudad(nombre);
  };

  // Sugerencia del autocompletado o ciudad guardada: por lat/lon, para no confundir homónimas
  const buscarLugar = (nombre: string, lat: number, lon: number) => {
    empezarBusqueda();
    nombreElegido.current = nombre;
    void buscarCoordenadas(lat, lon);
  };

  const elegirLugar = (lugar: GeocodeResult) => buscarLugar(nombreCiudad(lugar), lugar.lat, lugar.lon);

  // Las entradas viejas del historial (solo nombre) se buscan por nombre, como antes
  const elegirGuardada = (c: CiudadGuardada) =>
    tieneCoordenadas(c) ? buscarLugar(c.nombre, c.lat, c.lon) : buscar(c.nombre);

  const ubicar = () => {
    empezarBusqueda();
    buscarUbicacion();
  };

  const volver = () => {
    window.scrollTo(0, 0);
    setPantalla('busqueda');
    setCiudad('');
    setAnuncio('');
    // Después del render, el foco vuelve al buscador
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const ocupado = cargando || girando;

  return (
    <>
      <Stars />

      <main>
        {/* La pantalla de búsqueda queda montada (oculta) para no recrear el globo 3D al volver */}
        <section
          className="pantalla pt-seguro pb-seguro px-seguro flex min-h-screen flex-col items-center"
          hidden={pantalla !== 'busqueda'}
          aria-labelledby="titulo-app"
          aria-busy={ocupado}
        >
          <div className="flex w-full flex-1 flex-col items-center justify-center gap-6 py-6 md:gap-8">
            <header className="text-center">
              <h1
                id="titulo-app"
                className="font-display text-[min(2.6rem,7.6vw)] font-extrabold leading-none tracking-[-1px] md:text-[3.25rem]"
              >
                Weather<span className="text-atmos">World</span>
              </h1>
              <p className="mt-2 text-[0.95rem] text-suave md:text-base">Explorá el clima de cualquier lugar del planeta</p>
            </header>

            <Globe ref={globoRef} activo={pantalla === 'busqueda'} />

            <div className="mt-2 flex w-full flex-col items-center gap-5">
              {ocupado ? (
                <Loading />
              ) : (
                <>
                  <SearchBar
                    valor={ciudad}
                    cargando={cargando}
                    onCambio={setCiudad}
                    onBuscar={buscar}
                    onElegirLugar={elegirLugar}
                    onUbicacion={ubicar}
                    inputRef={inputRef}
                  />
                  <History ciudades={historial} onElegir={elegirGuardada} />
                </>
              )}
            </div>
          </div>
        </section>

        {pantalla === 'clima' && data && <WeatherScreen data={data} nombre={nombreVisible} unit={unit} onVolver={volver} />}
      </main>

      {/* Región viva para lectores de pantalla: estado de la búsqueda y resultado */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {anuncio}
      </p>

      {error && (
        <ErrorToast
          key={error.id}
          mensaje={error.mensaje}
          onCerrar={cerrarError}
          onReintentar={
            error.reintentable
              ? () => {
                  // Reintentar conserva el nombre elegido de la búsqueda que falló
                  const nombre = nombreElegido.current;
                  empezarBusqueda();
                  nombreElegido.current = nombre;
                  reintentar();
                }
              : undefined
          }
        />
      )}
    </>
  );
}
