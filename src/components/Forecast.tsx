import type { CSSProperties } from 'react';
import type { Unit } from '../hooks/useUnit';
import type { Forecast as ForecastData } from '../types/weather';
import { diaPronostico } from '../utils/time';
import { resumenDiario, type Cielo } from '../utils/weather';
import WeatherIcon from './WeatherIcon';

interface Props {
  forecast: ForecastData;
  /** Offset de la ciudad (del clima actual), para agrupar por día local */
  timezone: number;
  /** Temperatura actual en °C: completa el día de hoy y marca un punto en su barra */
  tempActual: number;
  /** Ícono de la fila "Hoy": el cielo actual */
  iconoHoy: { cielo: Cielo; esNoche: boolean };
  conv: Unit['conv'];
  unidad: string;
  /** Índice de la primera fila en la animación escalonada */
  desde?: number;
}

// Escala de color por temperatura (°C), de frío a calor
const ESCALA: [number, [number, number, number]][] = [
  [-5, [127, 211, 255]],
  [8, [79, 195, 247]],
  [16, [126, 214, 160]],
  [23, [255, 201, 60]],
  [30, [255, 138, 61]],
  [38, [255, 90, 79]],
];

function colorTemp(t: number): string {
  const [primero, ultimo] = [ESCALA[0]!, ESCALA[ESCALA.length - 1]!];
  if (t <= primero[0]) return `rgb(${primero[1].join(',')})`;
  if (t >= ultimo[0]) return `rgb(${ultimo[1].join(',')})`;
  const i = ESCALA.findIndex(([limite]) => t < limite);
  const [t0, c0] = ESCALA[i - 1]!;
  const [t1, c1] = ESCALA[i]!;
  const k = (t - t0) / (t1 - t0);
  return `rgb(${c0.map((c, j) => Math.round(c + (c1[j]! - c) * k)).join(',')})`;
}

export default function Forecast({ forecast, timezone, tempActual, iconoHoy, conv, unidad, desde = 0 }: Props) {
  const dias = resumenDiario(forecast.list, timezone, tempActual);
  if (dias.length === 0) return null;

  // La barra de cada día se ubica dentro del rango total de los 5 días
  const minTotal = Math.min(...dias.map((d) => d.min));
  const maxTotal = Math.max(...dias.map((d) => d.max));
  const rango = Math.max(1, maxTotal - minTotal);
  const pct = (t: number) => ((t - minTotal) / rango) * 100;

  return (
    <section
      aria-labelledby="titulo-pronostico"
      className="glass entrada rounded-hero px-4 pb-2 pt-4 sm:px-6"
      style={{ '--i': desde } as CSSProperties}
    >
      <h3
        id="titulo-pronostico"
        className="mb-1 text-[0.8rem] font-bold uppercase tracking-[1.2px] text-suave"
      >
        Próximos 5 días
      </h3>
      <ul className="divide-y divide-white/10">
        {dias.map((dia, i) => {
          const fecha = diaPronostico(dia.dt, timezone);
          const nombre = dia.esHoy ? 'Hoy' : fecha.semana;
          const izquierda = pct(dia.min);
          const ancho = Math.max(pct(dia.max) - izquierda, 4);
          return (
            <li
              key={dia.dt}
              className="entrada grid grid-cols-[3.4rem_1.9rem_2.6rem_1fr_2.6rem] items-center gap-2 py-3 sm:grid-cols-[4.5rem_2.25rem_3rem_1fr_3rem] sm:gap-4"
              style={{ '--i': desde + 1 + i } as CSSProperties}
            >
              <span className="sr-only">
                {dia.esHoy ? 'Hoy' : fecha.completo}: {dia.descripcion}, mínima {conv(dia.min)}
                {unidad}, máxima {conv(dia.max)}
                {unidad}.
              </span>
              <span className="font-medium" aria-hidden="true">
                {nombre}
                {!dia.esHoy && <span className="ml-1 text-[0.8rem] text-suave">{fecha.numero}</span>}
              </span>
              <WeatherIcon
                cielo={dia.esHoy ? iconoHoy.cielo : dia.cielo}
                esNoche={dia.esHoy && iconoHoy.esNoche}
                className="h-7 w-7 sm:h-8 sm:w-8"
              />
              <span className="text-right tabular-nums text-suave" aria-hidden="true">
                {conv(dia.min)}°
              </span>
              <span className="relative h-1.5 rounded-full bg-white/15" aria-hidden="true">
                <span
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    left: `${izquierda}%`,
                    width: `${ancho}%`,
                    background: `linear-gradient(90deg, ${colorTemp(dia.min)}, ${colorTemp(dia.max)})`,
                  }}
                />
                {dia.esHoy && (
                  <span
                    className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0b1426] bg-white"
                    style={{ left: `${pct(tempActual)}%` }}
                  />
                )}
              </span>
              <span className="font-semibold tabular-nums" aria-hidden="true">
                {conv(dia.max)}°
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
