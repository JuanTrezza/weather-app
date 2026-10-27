import type { GeocodeResult } from '../types/weather';

/** Bandera emoji a partir del código ISO de 2 letras ("AR" → 🇦🇷). Windows muestra las letras en lugar de la bandera. */
export function banderaEmoji(iso: string): string {
  if (!/^[A-Za-z]{2}$/.test(iso)) return '';
  return String.fromCodePoint(...[...iso.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

let nombresPaises: Intl.DisplayNames | null = null;

/** Nombre del país en castellano ("ES" → "España"); si el navegador no puede, el código */
export function nombrePais(iso: string): string {
  try {
    nombresPaises ??= new Intl.DisplayNames(['es'], { type: 'region' });
    return nombresPaises.of(iso.toUpperCase()) ?? iso;
  } catch {
    return iso;
  }
}

/** Nombre de la ciudad en castellano si la API lo trae (local_names.es) */
export const nombreCiudad = (lugar: GeocodeResult) => lugar.local_names?.es ?? lugar.name;

/** "Ciudad, Provincia/Estado, País" */
export function etiquetaLugar(lugar: GeocodeResult): string {
  return [nombreCiudad(lugar), lugar.state, nombrePais(lugar.country)].filter(Boolean).join(', ');
}

/** La API a veces repite la misma ciudad (mismo nombre, provincia y país): nos quedamos con la primera */
export function sinDuplicados(lugares: GeocodeResult[]): GeocodeResult[] {
  const vistos = new Set<string>();
  return lugares.filter((l) => {
    const clave = etiquetaLugar(l).toLowerCase();
    if (vistos.has(clave)) return false;
    vistos.add(clave);
    return true;
  });
}
