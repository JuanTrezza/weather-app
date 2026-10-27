import type { CSSProperties, ComponentType, SVGProps } from 'react';
import type { CurrentWeather } from '../types/weather';
import { formatHoraUTC } from '../utils/time';
import { aKmh, dirViento } from '../utils/weather';
import {
  IconoAmanecer,
  IconoAtardecer,
  IconoGota,
  IconoNubes,
  IconoOjo,
  IconoPresion,
  IconoRafaga,
  IconoViento,
} from './Icons';

interface Detalle {
  Icono: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  valor: string;
  extra?: string;
}

interface Props {
  current: CurrentWeather;
  /** Índice de la primera tarjeta en la animación escalonada */
  desde?: number;
}

export default function Details({ current, desde = 0 }: Props) {
  const { wind, clouds, visibility } = current;

  const detalles: Detalle[] = [
    { Icono: IconoGota, label: 'Humedad', valor: `${current.main.humidity}%` },
    {
      Icono: IconoViento,
      label: 'Viento',
      valor: `${aKmh(wind.speed)} km/h`,
      extra: `Dirección ${dirViento(wind.deg ?? 0)}`,
    },
    // Ráfagas y nubosidad solo si vienen en la respuesta
    ...(wind.gust !== undefined ? [{ Icono: IconoRafaga, label: 'Ráfagas', valor: `${aKmh(wind.gust)} km/h` }] : []),
    ...(clouds ? [{ Icono: IconoNubes, label: 'Nubosidad', valor: `${clouds.all}%` }] : []),
    {
      Icono: IconoOjo,
      label: 'Visibilidad',
      valor: visibility === undefined ? '—' : `${(visibility / 1000).toFixed(1)} km`,
    },
    { Icono: IconoPresion, label: 'Presión', valor: `${current.main.pressure} hPa` },
  ];

  // Para que no queden huecos, la última tarjeta ocupa las columnas que sobran en su fila
  // (2 columnas en mobile, 3 en desktop). La del sol va abajo, siempre a todo el ancho.
  const n = detalles.length;
  const spanUltima = `${n % 2 === 1 ? 'col-span-2' : ''} ${['', 'sm:col-span-3', 'sm:col-span-2'][n % 3]}`;

  // Posición del sol entre amanecer y atardecer (null de noche)
  const { sunrise, sunset } = current.sys;
  const progreso = current.dt >= sunrise && current.dt <= sunset ? (current.dt - sunrise) / (sunset - sunrise) : null;
  // Punto sobre la curva Bézier del SVG (M10 52 Q100 -28 190 52)
  const t = progreso ?? 0;
  const solX = 10 + t * 180;
  const solY = 52 - 160 * t * (1 - t);

  return (
    <section aria-labelledby="titulo-detalles">
      <h3 id="titulo-detalles" className="sr-only">
        Detalles del clima
      </h3>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {detalles.map(({ Icono, label, valor, extra }, i) => (
          <li
            key={label}
            className={`glass-interactiva entrada flex flex-col gap-2 p-4 ${i === n - 1 ? spanUltima : ''}`}
            style={{ '--i': desde + i } as CSSProperties}
          >
            <span className="flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.8px] text-suave">
              <Icono className="h-[18px] w-[18px] text-atmos" />
              {label}
            </span>
            <span className="text-[1.4rem] font-semibold tabular-nums leading-tight">{valor}</span>
            {extra && <span className="text-[0.8rem] text-suave">{extra}</span>}
          </li>
        ))}

        {/* Amanecer y atardecer en hora local de la ciudad */}
        <li
          className="glass-interactiva entrada col-span-2 flex items-center justify-between gap-3 p-4 sm:col-span-3"
          style={{ '--i': desde + n } as CSSProperties}
        >
          {[
            { Icono: IconoAmanecer, label: 'Amanecer', hora: sunrise, alinear: 'items-start' },
            { Icono: IconoAtardecer, label: 'Atardecer', hora: sunset, alinear: 'items-end order-last' },
          ].map(({ Icono, label, hora, alinear }) => (
            <span key={label} className={`flex shrink-0 flex-col gap-2 ${alinear}`}>
              <span className="flex items-center gap-2 text-[0.75rem] font-medium uppercase tracking-[0.8px] text-suave">
                <Icono className="h-[18px] w-[18px] text-atmos" />
                {label}
              </span>
              <span className="text-[1.4rem] font-semibold tabular-nums leading-tight">
                {formatHoraUTC(hora, current.timezone)}
              </span>
            </span>
          ))}
          {/* Recorrido del sol en el día; el punto marca dónde está ahora */}
          <svg viewBox="0 0 200 60" className="h-12 min-w-0 max-w-[260px] flex-1" aria-hidden="true">
            <path d="M10 52 Q100 -28 190 52" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeDasharray="4 5" />
            <line x1="4" y1="52" x2="196" y2="52" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            {progreso !== null && (
              <circle cx={solX} cy={solY} r="6" fill="#ffc93c" stroke="rgba(255,201,60,0.35)" strokeWidth="6" />
            )}
          </svg>
        </li>
      </ul>
    </section>
  );
}
