import { useEffect } from 'react';

interface Props {
  mensaje: string;
  onCerrar: () => void;
}

const DURACION_MS = 4000;

/** Mensaje de error que se cierra solo a los 4 s (o con el botón). Usar con key para reiniciar el timer. */
export default function ErrorToast({ mensaje, onCerrar }: Props) {
  useEffect(() => {
    const timeout = setTimeout(onCerrar, DURACION_MS);
    return () => clearTimeout(timeout);
  }, [onCerrar]);

  return (
    <div
      role="alert"
      className="fixed bottom-6 left-1/2 z-[100] flex min-w-[min(300px,calc(100vw-32px))] max-w-[calc(100vw-32px)] -translate-x-1/2 animate-aparecer items-center gap-3 rounded-card border border-[rgba(255,100,100,0.3)] bg-[rgba(183,28,28,0.9)] px-6 py-4 backdrop-blur-[10px]"
    >
      <span aria-hidden="true">❌</span>
      <p className="flex-1 text-[0.95rem]">{mensaje}</p>
      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar mensaje de error"
        className="cursor-pointer rounded-lg border border-white/30 bg-transparent px-3 py-1 font-sans text-[0.85rem] text-white"
      >
        Cerrar
      </button>
    </div>
  );
}
