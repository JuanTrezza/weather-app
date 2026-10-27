import type { FormEvent } from 'react';

interface Props {
  valor: string;
  cargando: boolean;
  onCambio: (valor: string) => void;
  onBuscar: (ciudad: string) => void;
  onUbicacion: () => void;
}

export default function SearchBar({ valor, cargando, onCambio, onBuscar, onUbicacion }: Props) {
  // Enviar el form = click en "Ver clima" o Enter en el input
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    onBuscar(valor.trim());
  };

  return (
    <form role="search" onSubmit={enviar} className="mb-6 flex w-full max-w-[480px] flex-col gap-3">
      <div className="flex items-center rounded-card border border-card-borde bg-card px-4 backdrop-blur-[10px] transition-colors duration-200 focus-within:border-atmos">
        <span className="mr-2.5 text-base opacity-60" aria-hidden="true">
          🔍
        </span>
        <input
          type="text"
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          placeholder="Buscá una ciudad..."
          autoComplete="off"
          aria-label="Nombre de la ciudad"
          className="min-w-0 flex-1 border-none bg-transparent py-4 font-sans text-base text-white outline-none placeholder:text-suave"
        />
        <button
          type="button"
          onClick={onUbicacion}
          title="Usar mi ubicación"
          aria-label="Usar mi ubicación"
          className="cursor-pointer rounded-lg border-none bg-transparent p-2 text-[1.2rem] transition-colors duration-200 hover:bg-white/10"
        >
          📍
        </button>
      </div>
      <button
        type="submit"
        disabled={cargando}
        aria-label="Buscar ciudad"
        className="w-full cursor-pointer rounded-card border-none bg-gradient-to-br from-oceano to-atmos p-4 font-display text-base font-bold tracking-[0.5px] text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,195,247,0.4)] disabled:opacity-60"
      >
        Ver clima
      </button>
    </form>
  );
}
