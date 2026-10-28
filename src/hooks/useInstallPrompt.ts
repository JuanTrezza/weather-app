import { useCallback, useEffect, useState } from 'react';

/** Evento de Chrome/Edge/Android (no está en los tipos del DOM) */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DESCARTADO_KEY = 'pwaInstalarDescartado';
const AVISO_IOS_KEY = 'pwaAvisoIosCerrado';
const SIETE_DIAS_MS = 7 * 24 * 60 * 60 * 1000;

const leer = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const escribir = (key: string, valor: string) => {
  try {
    localStorage.setItem(key, valor);
  } catch {
    // Sin localStorage el aviso puede volver a aparecer; no es grave
  }
};

const yaInstalada = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  // Safari en iOS
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// iPadOS se presenta como Mac: se distingue por la pantalla táctil
const esIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const descartadoHaceMenosDe7Dias = () => Date.now() - Number(leer(DESCARTADO_KEY) ?? 0) < SIETE_DIAS_MS;

export type Instalacion =
  | { tipo: 'nativa'; instalar: () => Promise<void>; descartar: () => void }
  | { tipo: 'ios'; descartar: () => void }
  // El navegador puede ofrecer instalar pero todavía no lanzó el evento: se reserva el lugar del botón
  | { tipo: 'esperando' }
  | { tipo: null };

/**
 * Cómo ofrecer instalar la app: botón nativo (cuando el navegador lanza beforeinstallprompt),
 * instrucciones para iOS, o nada (ya instalada, descartada hace menos de 7 días, o navegador sin soporte).
 */
export function useInstallPrompt(): Instalacion {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [instalada, setInstalada] = useState(yaInstalada);
  const [avisoIos, setAvisoIos] = useState(() => !yaInstalada() && esIOS() && !leer(AVISO_IOS_KEY));
  // beforeinstallprompt suele llegar después de la primera pintura: si el botón apareciera sin lugar reservado,
  // empujaría el contenido centrado (layout shift)
  const [puedeOfrecer] = useState(() => 'onbeforeinstallprompt' in window && !descartadoHaceMenosDe7Dias());

  useEffect(() => {
    const alOfrecer = (e: Event) => {
      e.preventDefault(); // mostramos nuestro botón en lugar del aviso del navegador
      if (!descartadoHaceMenosDe7Dias()) setEvento(e as BeforeInstallPromptEvent);
    };
    const alInstalar = () => {
      setInstalada(true);
      setEvento(null);
    };
    const modo = window.matchMedia('(display-mode: standalone)');
    const alCambiarModo = () => setInstalada(yaInstalada());

    window.addEventListener('beforeinstallprompt', alOfrecer);
    window.addEventListener('appinstalled', alInstalar);
    modo.addEventListener('change', alCambiarModo);
    return () => {
      window.removeEventListener('beforeinstallprompt', alOfrecer);
      window.removeEventListener('appinstalled', alInstalar);
      modo.removeEventListener('change', alCambiarModo);
    };
  }, []);

  const descartar = useCallback(() => {
    escribir(DESCARTADO_KEY, String(Date.now()));
    setEvento(null);
  }, []);

  const instalar = useCallback(async () => {
    if (!evento) return;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    // El evento sirve una sola vez; si lo rechazó en el diálogo del navegador, cuenta como descartado
    setEvento(null);
    if (outcome === 'dismissed') escribir(DESCARTADO_KEY, String(Date.now()));
  }, [evento]);

  const cerrarAvisoIos = useCallback(() => {
    escribir(AVISO_IOS_KEY, '1');
    setAvisoIos(false);
  }, []);

  if (instalada) return { tipo: null };
  if (evento) return { tipo: 'nativa', instalar, descartar };
  if (avisoIos) return { tipo: 'ios', descartar: cerrarAvisoIos };
  if (puedeOfrecer) return { tipo: 'esperando' };
  return { tipo: null };
}
