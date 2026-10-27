import { useEffect, useRef, useState } from 'react';
import type { Unit } from '../hooks/useUnit';
import type { WeatherData } from '../types/weather';
import { resumenDiario, tipoCielo } from '../utils/weather';
import Details from './Details';
import Forecast from './Forecast';
import HourlyChart from './HourlyChart';
import { IconoVolver } from './Icons';
import UnitToggle from './UnitToggle';
import WeatherHero from './WeatherHero';

interface Props {
  data: WeatherData;
  /** Nombre de la ciudad a mostrar (el elegido, o el de la API) */
  nombre: string;
  unit: Unit;
  onVolver: () => void;
}

export default function WeatherScreen({ data, nombre, unit, onVolver }: Props) {
  const { current, forecast } = data;
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const [compacto, setCompacto] = useState(false);

  // Al llegar a la pantalla, el foco va al nombre de la ciudad (teclado y lectores de pantalla)
  useEffect(() => {
    tituloRef.current?.focus({ preventScroll: true });
  }, [current]);

  // Header compacto: cuando el nombre de la ciudad sale de la vista, aparece arriba
  useEffect(() => {
    const titulo = tituloRef.current;
    if (!titulo) return;
    const observer = new IntersectionObserver(([entry]) => setCompacto(!entry?.isIntersecting), {
      rootMargin: '-64px 0px 0px 0px',
    });
    observer.observe(titulo);
    return () => observer.disconnect();
  }, []);

  // Máxima y mínima de hoy: del pronóstico (más la temperatura actual); si no hay tramos de hoy, del clima actual
  const hoy = resumenDiario(forecast.list, current.timezone, current.main.temp, 1)[0];
  const max = hoy?.esHoy ? hoy.max : current.main.temp_max;
  const min = hoy?.esHoy ? hoy.min : current.main.temp_min;

  return (
    <section className="min-h-screen pb-seguro" aria-labelledby="ciudad-nombre">
      <header
        className={`pt-seguro px-seguro sticky top-0 z-20 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          compacto ? 'border-b border-white/10 bg-black/30 backdrop-blur-xl' : 'border-b border-transparent'
        }`}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2 pb-2">
          <button
            type="button"
            onClick={onVolver}
            aria-label="Volver a la búsqueda"
            className="glass-interactiva inline-flex h-tactil shrink-0 items-center gap-1 rounded-full pl-2.5 pr-4 text-[0.95rem]"
          >
            <IconoVolver className="h-5 w-5" />
            Volver
          </button>
          <p
            className={`min-w-0 flex-1 truncate text-center font-display font-bold transition-opacity duration-300 ${
              compacto ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          >
            {nombre} <span className="font-sans font-medium tabular-nums text-suave">{unit.conv(current.main.temp)}{unit.unidad}</span>
          </p>
          <UnitToggle unit={unit} />
        </div>
      </header>

      <div className="px-seguro mt-2">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          <WeatherHero current={current} nombre={nombre} max={max} min={min} unit={unit} tituloRef={tituloRef} />
          <Details current={current} desde={1} />
          <HourlyChart forecast={forecast} timezone={current.timezone} conv={unit.conv} unidad={unit.unidad} desde={9} />
          <Forecast
            forecast={forecast}
            timezone={current.timezone}
            tempActual={current.main.temp}
            // "Hoy" muestra el cielo de ahora (de noche, la luna), no el del mediodía
            iconoHoy={{ cielo: tipoCielo(current.weather[0]), esNoche: current.weather[0]?.icon.endsWith('n') ?? false }}
            conv={unit.conv}
            unidad={unit.unidad}
            desde={10}
          />
        </div>
      </div>
    </section>
  );
}
