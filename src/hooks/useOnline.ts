import { useSyncExternalStore } from 'react';

function suscribir(onCambio: () => void) {
  window.addEventListener('online', onCambio);
  window.addEventListener('offline', onCambio);
  return () => {
    window.removeEventListener('online', onCambio);
    window.removeEventListener('offline', onCambio);
  };
}

/** true si el navegador tiene conexión (navigator.onLine + eventos online/offline) */
export function useOnline(): boolean {
  return useSyncExternalStore(suscribir, () => navigator.onLine);
}
