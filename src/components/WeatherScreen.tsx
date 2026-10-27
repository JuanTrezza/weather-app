import type { Unit } from '../hooks/useUnit';
import type { WeatherData } from '../types/weather';
import { fechaHoraLocal } from '../utils/time';
import { obtenerIcono } from '../utils/weather';
import Details from './Details';
import Forecast from './Forecast';

interface Props {
  data: WeatherData;
  unit: Unit;
  onVolver: () => void;
}

export default function WeatherScreen({ data, unit, onVolver }: Props) {
  const { current, forecast } = data;
  const { conv, unidad } = unit;
  const clima = current.weather[0];
  const condicion = clima?.main.toLowerCase() ?? '';
  const esNoche = clima?.icon.includes('n') ?? false;

  // Fecha y hora LOCAL de la ciudad (usa el offset timezone de la API, no el del navegador)
  const { dia, hora } = fechaHoraLocal(current.timezone);
  const pais = current.sys.country ? `${current.sys.country} · ` : '';

  return (
    <section className="pantalla" aria-labelledby="ciudad-nombre">
      <button
        type="button"
        onClick={onVolver}
        aria-label="Volver a la búsqueda"
        className="mb-6 cursor-pointer rounded-full border border-card-borde bg-card px-[18px] py-2 font-sans text-[13.333px] text-white backdrop-blur-[10px] transition-all duration-200 hover:border-atmos"
      >
        ← Volver
      </button>

      {/* CABECERA */}
      <div className="mb-8 flex items-start justify-between gap-4 max-[480px]:flex-col max-[480px]:gap-2">
        <div className="min-w-0">
          <h2
            id="ciudad-nombre"
            className="font-display text-[2.2rem] font-extrabold leading-[1.1] [overflow-wrap:anywhere]"
          >
            {current.name}
          </h2>
          <p className="mt-1 text-base text-suave">
            {pais}
            {current.coord.lat.toFixed(2)}°, {current.coord.lon.toFixed(2)}°
          </p>
        </div>
        <p className="shrink-0 text-right text-[0.9rem] text-suave">
          {dia}
          <br />
          {hora} <span className="text-[0.75rem] opacity-60">(hora local)</span>
        </p>
      </div>

      {/* CLIMA PRINCIPAL */}
      <div className="mb-8 text-center">
        {/* Si no entra (pantallas angostas, °F) el botón de unidad baja a otra línea en vez de desbordar */}
        <div className="mb-2 flex flex-wrap items-center justify-center gap-4 max-[360px]:gap-2">
          <span
            role="img"
            aria-label={clima?.description ?? ''}
            className="text-[5rem] [filter:drop-shadow(0_0_20px_rgba(255,255,255,0.3))] max-[360px]:text-[3.5rem]"
          >
            {obtenerIcono(condicion, esNoche)}
          </span>
          <span className="bg-gradient-to-br from-white to-atmos bg-clip-text font-display text-[6rem] font-extrabold leading-none text-transparent max-[480px]:text-[4.5rem] max-[360px]:text-[3.5rem]">
            {conv(current.main.temp)}
            {unidad}
          </span>
          {/* Muestra la unidad a la que se puede cambiar */}
          <button
            type="button"
            onClick={unit.alternar}
            aria-label="Cambiar unidad de temperatura"
            className="ml-1 cursor-pointer self-center rounded-lg border border-atmos/35 bg-atmos/[0.12] px-3 py-1.5 font-display text-base font-bold text-atmos transition-all duration-200 hover:-translate-y-px hover:bg-atmos/25"
          >
            {unit.esCelsius ? '°F' : '°C'}
          </button>
        </div>
        <p className="mx-auto mb-1 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap text-[1.2rem] capitalize leading-[1.3]">
          {clima?.description}
        </p>
        <p className="text-[0.95rem] text-suave">
          Sensación térmica: {conv(current.main.feels_like)}
          {unidad}
        </p>
      </div>

      <Details current={current} />
      <Forecast forecast={forecast} timezone={current.timezone} conv={conv} />
    </section>
  );
}
