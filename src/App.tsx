import { useCallback, useEffect, useState } from 'react';
import ErrorToast from './components/ErrorToast';
import Globe from './components/Globe';
import History from './components/History';
import Loading from './components/Loading';
import SearchBar from './components/SearchBar';
import Stars from './components/Stars';
import WeatherScreen from './components/WeatherScreen';
import { useHistory } from './hooks/useHistory';
import { useUnit } from './hooks/useUnit';
import { useWeather } from './hooks/useWeather';
import type { WeatherData } from './types/weather';
import { obtenerTema } from './utils/weather';

type Pantalla = 'busqueda' | 'clima';

export default function App() {
  const [pantalla, setPantalla] = useState<Pantalla>('busqueda');
  const [ciudad, setCiudad] = useState('');
  // id distinto en cada error, para reiniciar el timer aunque el mensaje se repita
  const [error, setError] = useState<{ mensaje: string; id: number } | null>(null);
  const { historial, agregar } = useHistory();
  const unit = useUnit();
  const { reiniciar: reiniciarUnidad } = unit;

  const mostrarError = useCallback((mensaje: string) => setError({ mensaje, id: Date.now() }), []);
  const cerrarError = useCallback(() => setError(null), []);

  const onExito = useCallback(
    (data: WeatherData) => {
      reiniciarUnidad();
      agregar(data.current.name);
      setPantalla('clima');
    },
    [reiniciarUnidad, agregar],
  );

  const { data, cargando, buscarCiudad, buscarUbicacion } = useWeather({ onExito, onError: mostrarError });

  // Tema visual según el clima: es una clase en <body> porque cambia el fondo de toda la página
  const clima = data?.current.weather[0];
  const tema =
    pantalla === 'clima' && clima ? obtenerTema(clima.main.toLowerCase(), clima.icon.includes('n')) : null;
  useEffect(() => {
    document.body.className = tema ?? '';
  }, [tema]);

  const buscar = (nombre: string) => {
    if (!nombre) return mostrarError('Ingresá el nombre de una ciudad.');
    void buscarCiudad(nombre);
  };

  const volver = () => {
    setPantalla('busqueda');
    setCiudad('');
  };

  return (
    <>
      <Stars />

      <main>
        {/* La pantalla de búsqueda queda montada (oculta) para no recrear el globo 3D al volver */}
        <section className="pantalla" hidden={pantalla !== 'busqueda'} aria-labelledby="titulo-app">
          <div className="flex flex-col items-center pt-10">
            <h1 id="titulo-app" className="mb-2 font-display text-[3rem] font-extrabold tracking-[-1px] max-[480px]:text-[min(2.2rem,7.5vw)]">
              Weather<span className="text-atmos">World</span>
            </h1>
            <p className="mb-10 text-center text-base text-suave">Explorá el clima de cualquier lugar del planeta</p>

            <Globe activo={pantalla === 'busqueda'} />

            <SearchBar
              valor={ciudad}
              cargando={cargando}
              onCambio={setCiudad}
              onBuscar={buscar}
              onUbicacion={buscarUbicacion}
            />

            <History ciudades={historial} onElegir={buscar} />
          </div>
        </section>

        {pantalla === 'clima' && data && <WeatherScreen data={data} unit={unit} onVolver={volver} />}
      </main>

      {cargando && <Loading />}
      {error && <ErrorToast key={error.id} mensaje={error.mensaje} onCerrar={cerrarError} />}
    </>
  );
}
