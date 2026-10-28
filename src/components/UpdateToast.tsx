import { useRegisterSW } from 'virtual:pwa-register/react';
import { IconoCerrar, IconoReintentar } from './Icons';

const UNA_HORA_MS = 60 * 60 * 1000;

/** Registra el service worker y avisa cuando hay una versión nueva (registerType: 'prompt') */
export default function UpdateToast() {
  const {
    needRefresh: [hayVersionNueva, setHayVersionNueva],
    updateServiceWorker,
  } = useRegisterSW({
    // Una app instalada puede quedar abierta días: busca versiones nuevas cada hora
    onRegisteredSW(_url, registro) {
      if (registro) setInterval(() => void registro.update(), UNA_HORA_MS);
    },
  });

  if (!hayVersionNueva) return null;

  return (
    // Centrado con flex (no con transform: la animación de entrada usa transform y lo pisaría)
    <div className="pointer-events-none fixed inset-x-0 bottom-[max(16px,calc(env(safe-area-inset-bottom)+8px))] z-[90] flex justify-center px-3">
      <div
        role="status"
        className="pointer-events-auto flex w-full max-w-[440px] items-center gap-3 rounded-2xl border border-white/15 bg-[rgba(8,13,36,0.92)] py-2 pl-4 pr-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl motion-safe:animate-entrada"
      >
        <p className="flex-1 text-[0.95rem]">Hay una versión nueva</p>
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="inline-flex h-tactil items-center gap-1.5 rounded-full bg-gradient-to-br from-oceano to-atmos px-4 text-[0.9rem] font-semibold text-white active:scale-[0.96]"
        >
          <IconoReintentar className="h-4 w-4" />
          Actualizar
        </button>
        <button
          type="button"
          onClick={() => setHayVersionNueva(false)}
          aria-label="Cerrar aviso de versión nueva"
          className="grid h-tactil w-tactil place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <IconoCerrar className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
