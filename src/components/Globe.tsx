import { Suspense, lazy, useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import tierraUrl from '../assets/textures/tierra.webp';
import { usePestanaVisible } from '../hooks/usePestanaVisible';
import type { GloboHandle } from './GlobeCanvas';

export type { GloboHandle };

// Three.js (~520 kB) llega en un chunk aparte, recién cuando se monta el globo 3D
const GlobeCanvas = lazy(() => import('./GlobeCanvas'));

interface Props {
  /** false mientras la pantalla está oculta: se pausa la animación */
  activo: boolean;
  ref?: Ref<GloboHandle>;
}

type Estado = 'imagen' | 'cargando' | 'listo' | 'sinWebGL';

/** Corre `fn` después de la primera pintura, cuando el navegador queda libre */
function despuesDePintar(fn: () => void) {
  let idle: number | undefined;
  let timer: number | undefined;
  // El rAF corre antes de pintar; el setTimeout siguiente, ya con el primer frame en pantalla
  const raf = requestAnimationFrame(() => {
    timer = window.setTimeout(() => {
      if (typeof window.requestIdleCallback === 'function') idle = requestIdleCallback(fn, { timeout: 2000 });
      else timer = window.setTimeout(fn, 200);
    });
  });
  return () => {
    cancelAnimationFrame(raf);
    clearTimeout(timer);
    if (idle !== undefined) cancelIdleCallback(idle);
  };
}

/**
 * Globo terráqueo. Primero se ve una imagen fija del globo (tierra.webp, el LCP);
 * el globo 3D se monta después, en segundo plano, y aparece con un fundido cruzado.
 */
export default function Globe({ activo, ref }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const globo3d = useRef<GloboHandle>(null);
  // Si se busca una ciudad antes de que el 3D esté listo, el globo arranca mirándola
  const destino = useRef<{ lat: number; lon: number } | null>(null);
  const [estado, setEstado] = useState<Estado>('imagen');
  const [enPantalla, setEnPantalla] = useState(true);
  const pestanaVisible = usePestanaVisible();

  useImperativeHandle(
    ref,
    () => ({
      girarHacia: (lat, lon) => {
        destino.current = { lat, lon };
        return globo3d.current?.girarHacia(lat, lon) ?? Promise.resolve();
      },
    }),
    [],
  );

  // Estables: GlobeCanvas arma la escena una sola vez
  const destinoInicial = useCallback(() => destino.current, []);
  const onListo = useCallback(() => setEstado('listo'), []);
  const onFallo = useCallback(() => setEstado('sinWebGL'), []);

  useEffect(() => despuesDePintar(() => setEstado((e) => (e === 'imagen' ? 'cargando' : e))), []);

  // Sin el globo en el viewport (por ejemplo, con el teclado abierto en mobile) no se renderiza
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entrada]) => setEnPantalla(entrada?.isIntersecting ?? true));
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  const listo = estado === 'listo';
  const fundido = 'transition-opacity duration-700 ease-out motion-reduce:transition-none';

  return (
    <div
      ref={wrapRef}
      role="img"
      aria-label={estado === 'sinWebGL' ? 'Globo terráqueo' : 'Globo terráqueo 3D. Arrastralo para girarlo.'}
      className={`relative aspect-square w-[min(72vw,300px)] md:w-[380px] lg:w-[440px] ${
        listo ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <div className="halo-globo" aria-hidden="true" />
      {/* Misma forma y encuadre que el canvas: es una captura del globo 3D en su posición inicial */}
      <img
        src={tierraUrl}
        alt=""
        width={880}
        height={880}
        fetchPriority="high"
        draggable={false}
        className={`absolute inset-0 h-full w-full select-none ${fundido} ${listo ? 'opacity-0' : 'opacity-100'}`}
      />
      {(estado === 'cargando' || listo) && (
        <Suspense fallback={null}>
          <GlobeCanvas
            handle={globo3d}
            animar={activo && enPantalla && pestanaVisible}
            destinoInicial={destinoInicial}
            onListo={onListo}
            onFallo={onFallo}
            className={`absolute inset-0 h-full w-full rounded-full ${fundido} ${listo ? 'opacity-100' : 'opacity-0'}`}
          />
        </Suspense>
      )}
      {/* Sombra debajo del globo */}
      <div className="sombra-globo" aria-hidden="true" />
    </div>
  );
}
