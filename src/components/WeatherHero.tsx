import type { Ref } from 'react';
import type { Unit } from '../hooks/useUnit';
import type { CurrentWeather } from '../types/weather';
import { fechaHoraLocal } from '../utils/time';
import { tipoCielo } from '../utils/weather';
import { IconoPin, IconoReloj } from './Icons';
import WeatherIcon from './WeatherIcon';

interface Props {
  current: CurrentWeather;
  nombre: string;
  /** Máxima y mínima del día en °C */
  max: number;
  min: number;
  unit: Unit;
  tituloRef?: Ref<HTMLHeadingElement>;
}

/** Tarjeta principal: ciudad, temperatura, ícono animado, descripción, máxima y mínima */
export default function WeatherHero({ current, nombre, max, min, unit, tituloRef }: Props) {
  const { conv, unidad } = unit;
  const clima = current.weather[0];
  const esNoche = clima?.icon.endsWith('n') ?? false;

  // Fecha y hora LOCAL de la ciudad (usa el offset timezone de la API, no el del navegador)
  const { dia, hora } = fechaHoraLocal(current.timezone);

  return (
    <article className="glass entrada relative overflow-hidden rounded-hero p-5 sm:p-7" aria-labelledby="ciudad-nombre">
      {/* Brillo suave (6 %: más fuerte rompería el contraste AA del texto que queda encima) */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_65%)]"
        aria-hidden="true"
      />

      <div className="relative flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h2
            id="ciudad-nombre"
            ref={tituloRef}
            tabIndex={-1}
            className="font-display text-[2rem] font-extrabold leading-[1.1] outline-none [overflow-wrap:anywhere] sm:text-[2.5rem]"
          >
            {nombre}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[0.9rem] text-white/90">
            <IconoPin className="h-4 w-4 shrink-0" />
            {current.sys.country ? `${current.sys.country} · ` : ''}
            {current.coord.lat.toFixed(2)}°, {current.coord.lon.toFixed(2)}°
          </p>
        </div>
        <p className="flex items-center gap-1.5 text-[0.9rem] text-white/90">
          <IconoReloj className="h-4 w-4 shrink-0" />
          <span>
            {dia.charAt(0).toUpperCase() + dia.slice(1)} · <span className="tabular-nums">{hora}</span>{' '}
            (hora local)
          </span>
        </p>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[min(5.5rem,19vw)] font-bold leading-none tracking-[-3px] tabular-nums sm:text-[7rem]">
          {conv(current.main.temp)}
          <span className="align-top text-[0.55em] font-bold text-white/85">{unidad}</span>
        </p>
        <WeatherIcon
          cielo={tipoCielo(clima)}
          esNoche={esNoche}
          animado
          label={clima?.description ?? ''}
          className="h-20 w-20 shrink-0 drop-shadow-[0_8px_24px_rgba(0,0,0,0.3)] min-[400px]:h-28 min-[400px]:w-28 sm:h-36 sm:w-36"
        />
      </div>

      <p className="relative mt-3 text-[1.25rem] font-medium first-letter:uppercase">{clima?.description}</p>
      <p className="relative mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[0.95rem] text-white/90">
        <span>
          Máx <strong className="font-semibold text-white tabular-nums">{conv(max)}°</strong> · Mín{' '}
          <strong className="font-semibold text-white tabular-nums">{conv(min)}°</strong>
        </span>
        <span>
          Sensación térmica <strong className="font-semibold text-white tabular-nums">{conv(current.main.feels_like)}{unidad}</strong>
        </span>
      </p>
    </article>
  );
}
