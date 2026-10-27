import type { Unit } from '../hooks/useUnit';

/** Selector segmentado °C / °F */
export default function UnitToggle({ unit }: { unit: Unit }) {
  const opcion = (celsius: boolean, texto: string) => {
    const activa = unit.esCelsius === celsius;
    return (
      <button
        type="button"
        aria-pressed={activa}
        onClick={activa ? undefined : unit.alternar}
        className={`h-tactil min-w-tactil rounded-full px-3 text-[0.95rem] font-bold tabular-nums transition-colors duration-200 ${
          activa ? 'bg-white text-[#0b1426]' : 'text-white hover:bg-white/10 active:bg-white/15'
        }`}
      >
        {texto}
      </button>
    );
  };

  return (
    <div role="group" aria-label="Unidad de temperatura" className="flex rounded-full border border-card-borde bg-card p-0.5 backdrop-blur-md">
      {opcion(true, '°C')}
      {opcion(false, '°F')}
    </div>
  );
}
