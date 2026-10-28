import { useSyncExternalStore } from 'react';

const suscribir = (avisar: () => void) => {
  document.addEventListener('visibilitychange', avisar);
  return () => document.removeEventListener('visibilitychange', avisar);
};

/** false mientras la pestaña está en segundo plano o la app instalada está minimizada */
export function usePestanaVisible() {
  return useSyncExternalStore(suscribir, () => document.visibilityState === 'visible');
}
