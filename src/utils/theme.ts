import type { CurrentWeather } from '../types/weather';
import type { Cielo } from './weather';

export type Fase = 'dia' | 'dorada' | 'noche';

/** Margen alrededor de amanecer/atardecer que cuenta como "hora dorada" */
const MARGEN_DORADA_S = 50 * 60;

/** Momento del día en la ciudad, según la hora de la medición y el amanecer/atardecer */
export function faseDelDia(current: CurrentWeather): Fase {
  const { dt, sys } = current;
  // En latitudes polares la API puede no traer amanecer/atardecer: usamos el ícono (d/n)
  if (!sys.sunrise || !sys.sunset) return current.weather[0]?.icon.endsWith('n') ? 'noche' : 'dia';
  if (Math.abs(dt - sys.sunrise) <= MARGEN_DORADA_S || Math.abs(dt - sys.sunset) <= MARGEN_DORADA_S) return 'dorada';
  return dt > sys.sunrise && dt < sys.sunset ? 'dia' : 'noche';
}

export interface Paleta {
  /** Degradado del fondo, de arriba a abajo */
  arriba: string;
  abajo: string;
  /** Opacidad de las estrellas (de día casi no se ven) */
  estrellas: number;
}

/** Fondo espacial de la pantalla de inicio */
export const PALETA_INICIO: Paleta = { arriba: '#030614', abajo: '#0a0f2e', estrellas: 1 };

// Todos los fondos son lo bastante oscuros para que el texto blanco y el texto
// secundario (text-suave, blanco al 80 %) pasen AA (4.5:1), incluso sobre las tarjetas glass (blanco al 8 %).
const PALETAS: Record<Cielo, Record<Fase, Paleta>> = {
  despejado: {
    dia: { arriba: '#0b3d6e', abajo: '#1a5288', estrellas: 0 },
    dorada: { arriba: '#2a1b4a', abajo: '#8a3b2a', estrellas: 0.35 },
    noche: { arriba: '#030614', abajo: '#0e1838', estrellas: 1 },
  },
  parcial: {
    dia: { arriba: '#123d63', abajo: '#2f5070', estrellas: 0 },
    dorada: { arriba: '#2b2145', abajo: '#7a4234', estrellas: 0.3 },
    noche: { arriba: '#050916', abajo: '#141d36', estrellas: 0.8 },
  },
  nubes: {
    dia: { arriba: '#26333f', abajo: '#435565', estrellas: 0 },
    dorada: { arriba: '#2c2636', abajo: '#5e4744', estrellas: 0.15 },
    noche: { arriba: '#0a0d14', abajo: '#1c222d', estrellas: 0.3 },
  },
  llovizna: {
    dia: { arriba: '#1c2d3e', abajo: '#33506a', estrellas: 0 },
    dorada: { arriba: '#24243a', abajo: '#47465c', estrellas: 0.1 },
    noche: { arriba: '#070c15', abajo: '#142235', estrellas: 0.2 },
  },
  lluvia: {
    dia: { arriba: '#122233', abajo: '#264563', estrellas: 0 },
    dorada: { arriba: '#1d1c33', abajo: '#3b3d58', estrellas: 0.1 },
    noche: { arriba: '#05090f', abajo: '#11203a', estrellas: 0.15 },
  },
  tormenta: {
    dia: { arriba: '#1a0f33', abajo: '#33245f', estrellas: 0 },
    dorada: { arriba: '#1a0b2e', abajo: '#3d2150', estrellas: 0.1 },
    noche: { arriba: '#0b0618', abajo: '#1f1440', estrellas: 0.2 },
  },
  nieve: {
    dia: { arriba: '#21435a', abajo: '#3a5a6e', estrellas: 0 },
    dorada: { arriba: '#2e3150', abajo: '#4d4862', estrellas: 0.15 },
    noche: { arriba: '#0b1220', abajo: '#1d2e45', estrellas: 0.5 },
  },
  niebla: {
    dia: { arriba: '#2a3438', abajo: '#4a575c', estrellas: 0 },
    dorada: { arriba: '#2d2a33', abajo: '#594d4b', estrellas: 0.1 },
    noche: { arriba: '#0b0e11', abajo: '#1e2428', estrellas: 0.2 },
  },
};

export function paletaPara(cielo: Cielo, fase: Fase): Paleta {
  return PALETAS[cielo][fase];
}

