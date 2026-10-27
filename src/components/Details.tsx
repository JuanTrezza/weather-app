import type { CurrentWeather } from '../types/weather';
import { formatHoraUTC } from '../utils/time';
import { dirViento } from '../utils/weather';

export default function Details({ current }: { current: CurrentWeather }) {
  const detalles = [
    { icono: '💧', label: 'Humedad', valor: `${current.main.humidity}%` },
    { icono: '💨', label: 'Viento', valor: `${Math.round(current.wind.speed * 3.6)} km/h ${dirViento(current.wind.deg ?? 0)}` },
    {
      icono: '👁️',
      label: 'Visibilidad',
      valor: current.visibility === undefined ? '—' : `${(current.visibility / 1000).toFixed(1)} km`,
    },
    { icono: '🌡️', label: 'Presión', valor: `${current.main.pressure} hPa` },
    // Amanecer y atardecer en hora local de la ciudad
    { icono: '🌅', label: 'Amanecer', valor: formatHoraUTC(current.sys.sunrise, current.timezone) },
    { icono: '🌇', label: 'Atardecer', valor: formatHoraUTC(current.sys.sunset, current.timezone) },
  ];

  return (
    <ul className="mb-8 grid grid-cols-3 gap-3 max-[480px]:grid-cols-2" aria-label="Detalles del clima">
      {detalles.map((d) => (
        <li
          key={d.label}
          className="flex flex-col gap-1.5 rounded-card border border-card-borde bg-card px-3 py-4 text-center backdrop-blur-[10px]"
        >
          <span className="text-[1.4rem]" aria-hidden="true">
            {d.icono}
          </span>
          <span className="font-display text-[1.1rem] font-bold">{d.valor}</span>
          <span className="text-[0.75rem] text-suave">{d.label}</span>
        </li>
      ))}
    </ul>
  );
}
