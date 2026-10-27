import { useEffect, useState } from 'react';
import { IconoAlerta, IconoCerrar, IconoReintentar } from './Icons';

interface Props {
  mensaje: string;
  /** Si viene, se muestra "Reintentar" (errores de red o 503) */
  onReintentar?: () => void;
  onCerrar: () => void;
}

/**
 * Toast de error arriba de la pantalla. Se cierra solo (4 s, u 8 s si se puede reintentar),
 * pero no mientras el puntero o el foco están encima. Usar con key para reiniciar el timer.
 */
export default function ErrorToast({ mensaje, onReintentar, onCerrar }: Props) {
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (pausado) return;
    const timeout = setTimeout(onCerrar, onReintentar ? 8000 : 4000);
    return () => clearTimeout(timeout);
  }, [pausado, onCerrar, onReintentar]);

  return (
    <div
      role="alert"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      className="fixed left-1/2 top-[max(12px,env(safe-area-inset-top))] z-[100] flex w-[min(560px,calc(100vw-24px))] animate-toast-entrada items-center gap-3 rounded-2xl border border-[rgba(255,120,120,0.35)] bg-[rgba(70,14,22,0.92)] py-2 pl-4 pr-2 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl [transform:translateX(-50%)]"
    >
      <IconoAlerta className="h-6 w-6 shrink-0 text-[#ff9b9b]" />
      <p className="flex-1 py-2 text-[0.95rem] leading-snug">{mensaje}</p>
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="inline-flex h-tactil shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3.5 text-[0.9rem] font-medium transition-colors hover:bg-white/25 active:bg-white/30"
        >
          <IconoReintentar className="h-4 w-4" />
          Reintentar
        </button>
      )}
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar mensaje de error"
        className="grid h-tactil w-tactil shrink-0 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        <IconoCerrar className="h-5 w-5" />
      </button>
    </div>
  );
}
