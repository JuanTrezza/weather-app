interface Props {
  ciudades: string[];
  onElegir: (ciudad: string) => void;
}

/** Búsquedas recientes. Los nombres van como texto (JSX), nunca como HTML. */
export default function History({ ciudades, onElegir }: Props) {
  return (
    <div className="flex max-w-[480px] flex-wrap items-center justify-center gap-2.5">
      <span className="text-[0.85rem] text-suave">Recientes:</span>
      {ciudades.length === 0 ? (
        <span className="text-[0.85rem] italic text-suave">Sin búsquedas recientes</span>
      ) : (
        <ul className="flex flex-wrap justify-center gap-1" aria-label="Búsquedas recientes">
          {ciudades.map((ciudad) => (
            <li key={ciudad}>
              <button
                type="button"
                onClick={() => onElegir(ciudad)}
                aria-label={`Ver clima de ${ciudad}`}
                className="cursor-pointer rounded-full border border-card-borde bg-card px-3.5 py-1.5 font-sans text-[0.85rem] text-white backdrop-blur-[10px] transition-all duration-200 hover:border-atmos hover:bg-atmos/10"
              >
                <span aria-hidden="true">📍 </span>
                {ciudad}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
