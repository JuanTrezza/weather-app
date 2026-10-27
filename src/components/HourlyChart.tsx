import { useId, type CSSProperties } from 'react';
import type { Unit } from '../hooks/useUnit';
import type { Forecast } from '../types/weather';
import { curvaSuave } from '../utils/chart';
import { formatHoraUTC } from '../utils/time';
import { tipoCielo } from '../utils/weather';
import { IconoGota } from './Icons';
import WeatherIcon from './WeatherIcon';

interface Props {
  forecast: Forecast;
  /** Offset de la ciudad, para mostrar la hora local */
  timezone: number;
  conv: Unit['conv'];
  unidad: string;
  /** Índice en la animación escalonada de entrada */
  desde?: number;
}

const PUNTOS = 8; // 8 × 3 h = 24 h
// Sistema de coordenadas del SVG: 100 de ancho por columna, 100 de alto
const ANCHO = PUNTOS * 100;
const ARRIBA = 30; // lugar para la temperatura encima del punto más alto
const ABAJO = 90;

/** Temperatura de las próximas 24 horas: curva SVG propia, sin librerías */
export default function HourlyChart({ forecast, timezone, conv, unidad, desde = 0 }: Props) {
  const id = useId();
  const items = forecast.list.slice(0, PUNTOS);
  if (items.length < 2) return null;

  const temps = items.map((i) => i.main.temp);
  const min = Math.min(...temps);
  const max = Math.max(...temps);
  const rango = Math.max(max - min, 1);
  const puntos = items.map((item, i) => ({
    x: i * 100 + 50,
    y: ABAJO - ((item.main.temp - min) / rango) * (ABAJO - ARRIBA),
  }));
  const curva = curvaSuave(puntos);
  const ultimo = puntos[puntos.length - 1]!;
  const area = `${curva} L${ultimo.x} 100 L${puntos[0]!.x} 100 Z`;

  const hora = (dt: number) => formatHoraUTC(dt, timezone);
  const lluvia = (pop = 0) => Math.round(pop * 100);
  const iMax = temps.indexOf(max);
  const iMin = temps.indexOf(min);
  const columnas = { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` };

  return (
    <section
      aria-labelledby={`${id}-titulo`}
      className="glass entrada rounded-hero px-4 pb-3 pt-4 sm:px-6"
      style={{ '--i': desde } as CSSProperties}
    >
      <h3 id={`${id}-titulo`} className="mb-2 text-[0.8rem] font-bold uppercase tracking-[1.2px] text-suave">
        Próximas 24 horas
      </h3>

      {/* En mobile se desplaza dentro de la tarjeta; la página no scrollea en horizontal */}
      <div
        role="region"
        aria-label="Gráfico de temperatura, desplazable"
        tabIndex={0}
        className="-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:thin] sm:-mx-6 sm:px-6"
      >
        <div className="relative min-w-[560px] tabular-nums">
          {/* Hora e ícono */}
          <div className="grid text-center" style={columnas} aria-hidden="true">
            {items.map((item) => (
              <div key={item.dt} className="flex flex-col items-center gap-1">
                <span className="text-[0.8rem] font-medium text-suave">{hora(item.dt)}</span>
                <WeatherIcon
                  cielo={tipoCielo(item.weather[0])}
                  esNoche={item.weather[0]?.icon.endsWith('n') ?? false}
                  className="h-7 w-7"
                />
              </div>
            ))}
          </div>

          {/* Curva con área degradada; las temperaturas y los puntos van en HTML para no deformarse */}
          <div className="relative mt-1 h-[120px]">
            <svg
              viewBox={`0 0 ${ANCHO} 100`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible motion-safe:animate-revelar"
              role="img"
              aria-labelledby={`${id}-svg-titulo ${id}-svg-desc`}
            >
              <title id={`${id}-svg-titulo`}>Temperatura de las próximas 24 horas</title>
              <desc id={`${id}-svg-desc`}>
                {`Entre ${hora(items[0]!.dt)} y ${hora(items[items.length - 1]!.dt)} (hora local): máxima de ${conv(max)}${unidad} a las ${hora(items[iMax]!.dt)} y mínima de ${conv(min)}${unidad} a las ${hora(items[iMin]!.dt)}.`}
              </desc>
              <defs>
                <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
                  {/* Arranca donde empieza la curva (ARRIBA), no en el borde del SVG */}
                  <stop offset={`${ARRIBA}%`} stopColor="#4fc3f7" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#4fc3f7" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id={`${id}-linea`} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#4fc3f7" />
                </linearGradient>
              </defs>
              <path d={area} fill={`url(#${id}-area)`} />
              <path
                d={curva}
                fill="none"
                stroke={`url(#${id}-linea)`}
                strokeWidth="2.5"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {items.map((item, i) => {
              const { x, y } = puntos[i]!;
              const posicion = { left: `${(x / ANCHO) * 100}%`, top: `${y}%` };
              return (
                <div key={item.dt} aria-hidden="true">
                  <span
                    className="absolute -translate-x-1/2 -translate-y-[calc(100%+8px)] text-[0.95rem] font-semibold"
                    style={posicion}
                  >
                    {conv(item.main.temp)}°
                  </span>
                  <span
                    className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#4fc3f7] bg-white"
                    style={posicion}
                  />
                </div>
              );
            })}
          </div>

          {/* Probabilidad de lluvia (solo si hay) */}
          <div className="grid h-5 text-center" style={columnas} aria-hidden="true">
            {items.map((item) => (
              <span key={item.dt} className="flex items-center justify-center gap-0.5 text-[0.75rem] text-white/90">
                {lluvia(item.pop) > 0 && (
                  <>
                    <IconoGota className="h-3.5 w-3.5 text-atmos" />
                    {lluvia(item.pop)}%
                  </>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Los mismos datos, para lectores de pantalla. El div lleva el sr-only: una tabla no se achica a 1px y generaría scroll */}
      <div className="sr-only">
        <table>
          <caption>Próximas 24 horas, hora local de la ciudad</caption>
          <thead>
            <tr>
              <th scope="col">Hora</th>
              <th scope="col">Temperatura</th>
              <th scope="col">Probabilidad de lluvia</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.dt}>
                <th scope="row">{hora(item.dt)}</th>
                <td>
                  {conv(item.main.temp)}
                  {unidad}
                </td>
                <td>{lluvia(item.pop)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
