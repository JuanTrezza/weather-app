import type { ReactNode, SVGProps } from 'react';

// Íconos de línea (24×24, trazo currentColor). Decorativos: van con aria-hidden.

type Props = SVGProps<SVGSVGElement>;

function Linea({ children, ...props }: Props & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconoGota = (p: Props) => (
  <Linea {...p}>
    <path d="M12 3.5c3.2 4 5.5 7.1 5.5 10a5.5 5.5 0 0 1-11 0c0-2.9 2.3-6 5.5-10z" />
    <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
  </Linea>
);

export const IconoViento = (p: Props) => (
  <Linea {...p}>
    <path d="M3 8h10.5a2.5 2.5 0 1 0-2.5-2.5" />
    <path d="M3 12h15.5a2.5 2.5 0 1 1-2.5 2.5" />
    <path d="M3 16h7" />
  </Linea>
);

export const IconoRafaga = (p: Props) => (
  <Linea {...p}>
    <path d="M3 7h8.5a2.5 2.5 0 1 0-2.5-2.5" />
    <path d="M3 11.5h14.5a2.5 2.5 0 1 1-2.5 2.5" />
    <path d="M5 16h6" />
    <path d="M7 19.5h8" />
    <path d="M19 17l2 2-2 2" />
  </Linea>
);

export const IconoOjo = (p: Props) => (
  <Linea {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </Linea>
);

export const IconoPresion = (p: Props) => (
  <Linea {...p}>
    <path d="M4.5 17a8.5 8.5 0 1 1 15 0" />
    <path d="M12 13l3.5-4" />
    <circle cx="12" cy="13.5" r="1.2" />
    <path d="M7 17h10" />
  </Linea>
);

export const IconoNubes = (p: Props) => (
  <Linea {...p}>
    <path d="M7 18.5h10.5a4 4 0 0 0 .3-8 5.5 5.5 0 0 0-10.6 1.2A3.4 3.4 0 0 0 7 18.5z" />
  </Linea>
);

export const IconoAmanecer = (p: Props) => (
  <Linea {...p}>
    <path d="M17 18a5 5 0 0 0-10 0" />
    <path d="M3 18h18" />
    <path d="M12 3v6M9.5 6.5 12 4l2.5 2.5" />
    <path d="M4.9 11.9l1.4 1.4M19.1 11.9l-1.4 1.4" />
    <path d="M7 21h10" />
  </Linea>
);

export const IconoAtardecer = (p: Props) => (
  <Linea {...p}>
    <path d="M17 18a5 5 0 0 0-10 0" />
    <path d="M3 18h18" />
    <path d="M12 9V3M9.5 6.5 12 9l2.5-2.5" />
    <path d="M4.9 11.9l1.4 1.4M19.1 11.9l-1.4 1.4" />
    <path d="M7 21h10" />
  </Linea>
);

export const IconoTermometro = (p: Props) => (
  <Linea {...p}>
    <path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0z" />
    <path d="M12 9v7" />
  </Linea>
);

export const IconoVolver = (p: Props) => (
  <Linea {...p}>
    <path d="M15 5l-7 7 7 7" />
  </Linea>
);

export const IconoUbicacion = (p: Props) => (
  <Linea {...p}>
    <circle cx="12" cy="12" r="3.5" />
    <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
    <circle cx="12" cy="12" r="7" />
  </Linea>
);

export const IconoBuscar = (p: Props) => (
  <Linea {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </Linea>
);

export const IconoPin = (p: Props) => (
  <Linea {...p}>
    <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
    <circle cx="12" cy="10" r="2.3" />
  </Linea>
);

export const IconoReloj = (p: Props) => (
  <Linea {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </Linea>
);

export const IconoAlerta = (p: Props) => (
  <Linea {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5" />
    <path d="M12 16.5v.01" />
  </Linea>
);

export const IconoReintentar = (p: Props) => (
  <Linea {...p}>
    <path d="M20 12a8 8 0 1 1-2.3-5.6" />
    <path d="M20 4v4.5h-4.5" />
  </Linea>
);

export const IconoCerrar = (p: Props) => (
  <Linea {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Linea>
);

export const IconoBrujula = (p: Props) => (
  <Linea {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M15.5 8.5l-2 5-5 2 2-5z" />
  </Linea>
);

export const IconoInstalar = (p: Props) => (
  <Linea {...p}>
    <path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5" />
    <path d="M4.5 16v2.5A2 2 0 0 0 6.5 20.5h11a2 2 0 0 0 2-2V16" />
  </Linea>
);

/** Ícono de "Compartir" de Safari en iOS */
export const IconoCompartir = (p: Props) => (
  <Linea {...p}>
    <path d="M12 3.5v11M8.5 7 12 3.5 15.5 7" />
    <path d="M8 10.5H6.5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H16" />
  </Linea>
);

export const IconoSinConexion = (p: Props) => (
  <Linea {...p}>
    <path d="M3 3l18 18" />
    <path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5.2-2.8M19 13a10 10 0 0 0-2.3-1.6M2 9.5a15 15 0 0 1 4.3-2.7M22 9.5A15 15 0 0 0 11 5.6" />
    <path d="M12 20v.01" />
  </Linea>
);

export const IconoConexion = (p: Props) => (
  <Linea {...p}>
    <path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 14 0M2 9.5a15 15 0 0 1 20 0" />
    <path d="M12 20v.01" />
  </Linea>
);
