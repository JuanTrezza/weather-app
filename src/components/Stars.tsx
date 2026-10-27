import { useState, type CSSProperties } from 'react';

interface Estrella {
  left: number;
  top: number;
  size: number;
  duracion: number;
  delay: number;
}

// 150 estrellas con posición, tamaño y velocidad de titileo aleatorios
function crearEstrellas(): Estrella[] {
  return Array.from({ length: 150 }, () => ({
    left: Math.random() * 100, // en % para que sea responsive
    top: Math.random() * 100,
    size: Math.random() * 2 + 1, // entre 1px y 3px
    duracion: Math.random() * 3 + 1, // cada estrella titila a su propio ritmo
    delay: Math.random() * 3,
  }));
}

/** Fondo espacial con estrellas; ocupa toda la pantalla detrás de todo */
export default function Stars() {
  // Se generan una sola vez: no cambian entre renders
  const [estrellas] = useState(crearEstrellas);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {estrellas.map((e, i) => (
        <span
          key={i}
          className="absolute animate-titilar rounded-full bg-white"
          style={
            {
              left: `${e.left}%`,
              top: `${e.top}%`,
              width: `${e.size}px`,
              height: `${e.size}px`,
              animationDelay: `${e.delay}s`,
              '--duracion': `${e.duracion}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
