import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { IconoCerrar, IconoCompartir, IconoInstalar } from './Icons';

/** "Instalar app" (Chrome/Edge/Android) o instrucciones para iOS. Nada si ya está instalada. */
export default function InstallPrompt() {
  const instalacion = useInstallPrompt();

  if (instalacion.tipo === 'nativa') {
    return (
      <div className="entrada flex items-center gap-1">
        <button
          type="button"
          onClick={() => void instalacion.instalar()}
          className="inline-flex min-h-tactil items-center gap-2 rounded-full border border-atmos/50 bg-atmos/10 px-4 text-[0.9rem] font-semibold text-white transition-[background-color,transform] hover:bg-atmos/20 active:scale-[0.96]"
        >
          <IconoInstalar className="h-5 w-5 text-atmos" />
          Instalar app
        </button>
        <button
          type="button"
          onClick={instalacion.descartar}
          aria-label="Ahora no instalar la app"
          title="Ahora no"
          className="grid h-tactil w-tactil place-items-center rounded-full text-suave transition-colors hover:bg-white/10 hover:text-white"
        >
          <IconoCerrar className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (instalacion.tipo === 'ios') {
    return (
      <div role="note" className="glass entrada flex w-full max-w-[520px] items-center gap-3 py-2 pl-4 pr-1 text-left text-[0.9rem]">
        <IconoInstalar className="h-6 w-6 shrink-0 text-atmos" />
        <p className="flex-1 leading-snug">
          Instalá WeatherWorld: tocá <strong className="font-semibold">Compartir</strong>{' '}
          <IconoCompartir className="inline h-4 w-4 align-[-2px]" /> y después{' '}
          <strong className="font-semibold">Agregar a inicio</strong>.
        </p>
        <button
          type="button"
          onClick={instalacion.descartar}
          aria-label="Cerrar aviso de instalación"
          className="grid h-tactil w-tactil shrink-0 place-items-center rounded-full text-suave transition-colors hover:bg-white/10 hover:text-white"
        >
          <IconoCerrar className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Mismo alto que el botón: cuando llegue el evento, aparece sin mover el contenido
  if (instalacion.tipo === 'esperando') return <div className="h-tactil" aria-hidden="true" />;

  return null;
}
