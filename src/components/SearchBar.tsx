import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type Ref } from 'react';
import { useCitySuggestions } from '../hooks/useCitySuggestions';
import type { GeocodeResult } from '../types/weather';
import { banderaEmoji, nombreCiudad, nombrePais } from '../utils/places';
import { IconoBuscar, IconoUbicacion } from './Icons';

interface Props {
  valor: string;
  cargando: boolean;
  onCambio: (valor: string) => void;
  /** Buscar por nombre (Enter o "Buscar" sin elegir una sugerencia) */
  onBuscar: (ciudad: string) => void;
  /** Se eligió una sugerencia: buscar por lat/lon */
  onElegirLugar: (lugar: GeocodeResult) => void;
  onUbicacion: () => void;
  /** Sin conexión: el autocompletado se desactiva y se explica por qué */
  sinConexion?: boolean;
  inputRef?: Ref<HTMLInputElement>;
}

/** Buscador tipo "pill" con autocompletado (patrón combobox de WAI-ARIA) */
export default function SearchBar({
  valor,
  cargando,
  onCambio,
  onBuscar,
  onElegirLugar,
  onUbicacion,
  sinConexion = false,
  inputRef,
}: Props) {
  const idAyuda = useId();
  const idLista = useId();
  const contenedorRef = useRef<HTMLDivElement>(null);
  // Solo se sugiere mientras el usuario escribe (no después de elegir, enviar o apretar Escape)
  const [escribiendo, setEscribiendo] = useState(false);
  const [activo, setActivo] = useState(-1);
  const { sugerencias, estado } = useCitySuggestions(valor, escribiendo && !cargando && !sinConexion);

  const hayOpciones = estado === 'listo' && sugerencias.length > 0;
  const abierto = escribiendo && (estado === 'cargando' || estado === 'listo');
  const idOpcion = (i: number) => `${idLista}-opcion-${i}`;

  const cerrar = () => {
    setEscribiendo(false);
    setActivo(-1);
  };

  // Cada lista nueva arranca sin opción activa
  useEffect(() => setActivo(-1), [sugerencias]);

  // Clic o toque afuera cierra la lista
  useEffect(() => {
    if (!abierto) return;
    const alTocar = (e: PointerEvent) => {
      if (!contenedorRef.current?.contains(e.target as Node)) cerrar();
    };
    document.addEventListener('pointerdown', alTocar);
    return () => document.removeEventListener('pointerdown', alTocar);
  }, [abierto]);

  const elegir = (lugar: GeocodeResult) => {
    cerrar();
    onCambio(nombreCiudad(lugar));
    onElegirLugar(lugar);
  };

  // Enviar el form = click en "Buscar" o Enter sin opción activa: búsqueda por nombre, como siempre
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    cerrar();
    onBuscar(valor.trim());
  };

  const alApretarTecla = (e: KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!abierto) {
          if (valor.trim().length >= 2) setEscribiendo(true);
          return;
        }
        if (!hayOpciones) return;
        e.preventDefault();
        const n = sugerencias.length;
        setActivo((a) => (e.key === 'ArrowDown' ? (a + 1) % n : a <= 0 ? n - 1 : a - 1));
        break;
      }
      case 'Enter': {
        const lugar = hayOpciones && activo >= 0 ? sugerencias[activo] : undefined;
        if (lugar) {
          e.preventDefault();
          elegir(lugar);
        }
        break;
      }
      case 'Escape':
        if (abierto) {
          e.preventDefault();
          cerrar();
        }
        break;
    }
  };

  const anuncio =
    !abierto ? '' : estado === 'cargando' ? 'Buscando ciudades…' : hayOpciones ? `${sugerencias.length} ciudades sugeridas` : 'Sin resultados';

  return (
    <div
      ref={contenedorRef}
      className="relative w-full max-w-[520px]"
      // Tab fuera del buscador (a otro elemento) también cierra
      onBlur={(e) => {
        if (!contenedorRef.current?.contains(e.relatedTarget as Node | null)) cerrar();
      }}
    >
      <form
        role="search"
        onSubmit={enviar}
        className="flex w-full items-center gap-1 rounded-full border border-white/15 bg-white/[0.09] py-1.5 pl-4 pr-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-[border-color,box-shadow] duration-200 focus-within:border-atmos/80 focus-within:shadow-[0_0_0_4px_rgba(79,195,247,0.18),0_10px_40px_rgba(0,0,0,0.35)]"
      >
        <IconoBuscar className="hidden h-5 w-5 shrink-0 text-suave sm:block" />
        <input
          ref={inputRef}
          type="text"
          value={valor}
          onChange={(e) => {
            onCambio(e.target.value);
            setEscribiendo(true);
          }}
          onKeyDown={alApretarTecla}
          placeholder="Buscá una ciudad..."
          autoComplete="off"
          enterKeyHint="search"
          aria-label="Nombre de la ciudad"
          role="combobox"
          aria-autocomplete={sinConexion ? 'none' : 'list'}
          aria-describedby={sinConexion ? idAyuda : undefined}
          aria-expanded={abierto}
          aria-controls={idLista}
          aria-activedescendant={abierto && activo >= 0 ? idOpcion(activo) : undefined}
          className="h-tactil min-w-0 flex-1 bg-transparent px-2 font-sans text-base text-white outline-none placeholder:text-suave"
        />
        <button
          type="button"
          onClick={onUbicacion}
          title="Usar mi ubicación"
          aria-label="Usar mi ubicación"
          className="grid h-tactil w-tactil shrink-0 place-items-center rounded-full text-suave transition-colors duration-200 hover:bg-white/10 hover:text-white active:bg-white/15"
        >
          <IconoUbicacion className="h-5 w-5" />
        </button>
        <button
          type="submit"
          disabled={cargando}
          aria-label="Buscar ciudad"
          className="grid h-tactil min-w-tactil shrink-0 place-items-center rounded-full bg-gradient-to-br from-oceano to-atmos text-[0.95rem] font-bold tracking-[0.3px] text-white transition-[transform,box-shadow,opacity] duration-200 hover:shadow-[0_6px_20px_rgba(79,195,247,0.45)] active:scale-[0.96] disabled:opacity-60 min-[360px]:px-4 sm:px-5"
        >
          {/* En pantallas muy angostas, solo la lupa: deja lugar al placeholder */}
          <IconoBuscar className="h-5 w-5 min-[360px]:hidden" />
          <span className="hidden min-[360px]:inline">Buscar</span>
        </button>
      </form>

      {/* Lista de sugerencias (el listbox existe siempre para que aria-controls apunte a algo) */}
      <div
        className={`absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-3xl border border-white/15 bg-[rgba(8,13,36,0.88)] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl ${
          abierto ? 'motion-safe:animate-entrada' : 'hidden'
        }`}
      >
        <ul id={idLista} role="listbox" aria-label="Ciudades sugeridas" className={hayOpciones ? '' : 'hidden'}>
          {hayOpciones &&
            sugerencias.map((lugar, i) => {
              const region = [lugar.state, nombrePais(lugar.country)].filter(Boolean).join(', ');
              return (
                <li
                  key={`${lugar.lat},${lugar.lon}`}
                  id={idOpcion(i)}
                  role="option"
                  aria-selected={i === activo}
                  // mousedown sin perder el foco del input; el clic elige
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegir(lugar)}
                  onMouseMove={() => setActivo(i)}
                  className={`flex min-h-tactil cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 transition-colors ${
                    i === activo ? 'bg-white/[0.14]' : 'hover:bg-white/[0.08]'
                  }`}
                >
                  <span className="w-7 shrink-0 text-center text-xl leading-none" aria-hidden="true">
                    {banderaEmoji(lugar.country)}
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="font-semibold">{nombreCiudad(lugar)}</span>
                    {region && <span className="text-suave">, {region}</span>}
                  </span>
                </li>
              );
            })}
        </ul>
        {!hayOpciones && (
          <p className="flex min-h-tactil items-center gap-2 px-3 text-[0.95rem] text-suave" aria-hidden="true">
            {estado === 'cargando' && (
              <span className="h-4 w-4 animate-girar rounded-full border-2 border-white/25 border-t-atmos" />
            )}
            {estado === 'cargando' ? 'Buscando…' : 'Sin resultados'}
          </p>
        )}
      </div>

      {sinConexion && (
        <p id={idAyuda} className="mt-2 px-4 text-center text-[0.8rem] text-suave">
          Sin conexión no hay sugerencias. Podés buscar por nombre las ciudades que ya consultaste.
        </p>
      )}

      {/* Estado para lectores de pantalla */}
      <p className="sr-only" role="status" aria-live="polite">
        {anuncio}
      </p>
    </div>
  );
}
