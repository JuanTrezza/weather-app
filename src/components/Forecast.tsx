import type { Unit } from '../hooks/useUnit';
import type { Forecast as ForecastData } from '../types/weather';
import { etiquetaDia } from '../utils/time';
import { agruparPorDia, obtenerIcono } from '../utils/weather';

interface Props {
  forecast: ForecastData;
  /** Offset de la ciudad (del clima actual), para agrupar por día local */
  timezone: number;
  conv: Unit['conv'];
}

export default function Forecast({ forecast, timezone, conv }: Props) {
  const dias = agruparPorDia(forecast.list, timezone);

  return (
    <section aria-labelledby="titulo-pronostico">
      <h3
        id="titulo-pronostico"
        className="mb-4 font-display text-base font-bold uppercase tracking-[1px] text-suave"
      >
        Próximos 5 días
      </h3>
      <ul className="grid grid-cols-5 gap-2.5 max-[480px]:grid-cols-3">
        {dias.map((item) => {
          const clima = item.weather[0];
          return (
            <li
              key={item.dt}
              className="flex flex-col gap-2 rounded-card border border-card-borde bg-card px-2 py-4 text-center backdrop-blur-[10px] transition-colors duration-200 hover:border-atmos"
            >
              <span className="text-[0.72rem] capitalize leading-[1.2] tracking-[0.3px] text-suave">
                {etiquetaDia(item.dt, timezone)}
              </span>
              <span className="text-[1.8rem]" role="img" aria-label={clima?.description ?? ''}>
                {obtenerIcono(clima?.main.toLowerCase() ?? '', false)}
              </span>
              <span className="font-display text-base font-bold">
                <span className="sr-only">Máxima: </span>
                {conv(item.main.temp_max)}°
              </span>
              <span className="text-[0.85rem] text-suave">
                <span className="sr-only">Mínima: </span>
                {conv(item.main.temp_min)}°
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
