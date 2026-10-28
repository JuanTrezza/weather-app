import { IconoCerrar, IconoConexion, IconoSinConexion } from './Icons';

interface Accion {
  etiqueta: string;
  alHacer: () => void;
  ocupado?: boolean;
}

interface Props {
  /** 'offline': sin conexión; 'reconectado': volvió la conexión (se ofrece actualizar) */
  estado: 'offline' | 'reconectado';
  texto: string;
  accion?: Accion;
  onCerrar?: () => void;
}

/** Aviso discreto de conexión, arriba del contenido */
export default function ConnectionBanner({ estado, texto, accion, onCerrar }: Props) {
  const offline = estado === 'offline';
  const Icono = offline ? IconoSinConexion : IconoConexion;

  return (
    <div
      role="status"
      className={`mx-auto flex w-full max-w-3xl flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border px-3 py-1.5 text-[0.85rem] backdrop-blur-md motion-safe:animate-entrada ${
        offline ? 'border-[rgba(255,201,60,0.35)] bg-[rgba(60,44,8,0.55)]' : 'border-[rgba(126,214,160,0.4)] bg-[rgba(10,48,30,0.55)]'
      }`}
    >
      <Icono className={`h-4 w-4 shrink-0 ${offline ? 'text-[#ffd76a]' : 'text-[#9be5b6]'}`} />
      {/* Con un ancho mínimo, si no entra junto al botón, el botón baja de línea (no el texto) */}
      <p className="min-w-[9rem] flex-1 py-1">{texto}</p>
      {accion && (
        <button
          type="button"
          onClick={accion.alHacer}
          disabled={accion.ocupado}
          className="min-h-tactil rounded-full px-3 text-[0.85rem] font-semibold underline decoration-white/40 underline-offset-4 transition-colors hover:bg-white/10 hover:decoration-white disabled:opacity-60"
        >
          {accion.ocupado ? 'Actualizando…' : accion.etiqueta}
        </button>
      )}
      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar aviso de conexión"
          className="grid h-tactil w-tactil place-items-center rounded-full text-white/80 hover:bg-white/10"
        >
          <IconoCerrar className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
