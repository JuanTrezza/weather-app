import type { CSSProperties } from 'react';
import type { CiudadGuardada } from '../hooks/useHistory';
import { banderaEmoji, nombrePais } from '../utils/places';
import { IconoPin, IconoReloj } from './Icons';

interface Props {
  ciudades: CiudadGuardada[];
  onElegir: (ciudad: CiudadGuardada) => void;
}

// Coordenadas fijas: así "Nueva York" no termina en la homónima de México y "Tokio" se guarda en castellano
const POPULARES: CiudadGuardada[] = [
  { nombre: 'Buenos Aires', pais: 'AR', lat: -34.6037, lon: -58.3816 },
  { nombre: 'Madrid', pais: 'ES', lat: 40.4168, lon: -3.7038 },
  { nombre: 'Tokio', pais: 'JP', lat: 35.6762, lon: 139.6503 },
  { nombre: 'Nueva York', pais: 'US', lat: 40.7128, lon: -74.006 },
  { nombre: 'Londres', pais: 'GB', lat: 51.5074, lon: -0.1278 },
];

const CHIP =
  'inline-flex min-h-tactil items-center gap-1.5 rounded-full border border-card-borde bg-card px-4 text-[0.9rem] text-white backdrop-blur-md transition-[background-color,border-color,transform] duration-200 hover:border-atmos/70 hover:bg-atmos/10 active:scale-[0.96]';

/** Búsquedas recientes, o ciudades populares si todavía no hay historial. Todo como texto (JSX). */
export default function History({ ciudades, onElegir }: Props) {
  const vacio = ciudades.length === 0;
  const chips = vacio ? POPULARES : ciudades;

  return (
    <div className="flex w-full max-w-[520px] flex-col items-center gap-3 text-center">
      {vacio ? (
        <p className="text-[0.9rem] text-suave">
          Todavía no buscaste ninguna ciudad. <span className="whitespace-nowrap">Probá con alguna de estas:</span>
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-[0.85rem] font-medium uppercase tracking-[1px] text-suave">
          <IconoReloj className="h-4 w-4" />
          Recientes
        </p>
      )}
      <ul className="flex flex-wrap justify-center gap-2" aria-label={vacio ? 'Ciudades populares' : 'Búsquedas recientes'}>
        {chips.map((ciudad, i) => (
          <li
            key={`${ciudad.nombre}-${ciudad.lat ?? ''}-${ciudad.lon ?? ''}`}
            className="entrada"
            style={{ '--i': i } as CSSProperties}
          >
            <button
              type="button"
              onClick={() => onElegir(ciudad)}
              aria-label={`Ver clima de ${ciudad.nombre}${ciudad.pais ? `, ${nombrePais(ciudad.pais)}` : ''}`}
              className={CHIP}
            >
              {ciudad.pais ? (
                <span className="font-emoji text-base leading-none" aria-hidden="true">
                  {banderaEmoji(ciudad.pais)}
                </span>
              ) : (
                <IconoPin className="h-4 w-4 text-atmos" />
              )}
              {ciudad.nombre}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
