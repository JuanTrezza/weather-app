import type { CSSProperties } from 'react';
import type { Cielo } from '../utils/weather';

interface Props {
  cielo: Cielo;
  esNoche?: boolean;
  /** Animación sutil (solo en la tarjeta principal; se apaga con reduced motion) */
  animado?: boolean;
  className?: string;
  /** Texto para lectores de pantalla; sin label el ícono es decorativo */
  label?: string;
}

const SOL = '#ffc93c';
const LUNA = '#f3e7b3';
const NUBE = '#eef3f8';
const NUBE_OSCURA = '#9aa7b8';

// Las animaciones de partes del SVG necesitan girar/moverse sobre su propia caja
const sobreSiMismo: CSSProperties = { transformBox: 'fill-box', transformOrigin: 'center' };

/** Ícono del clima en SVG (64×64) */
export default function WeatherIcon({ cielo, esNoche = false, animado = false, className, label }: Props) {
  const anim = (clase: string) => (animado ? `motion-safe:${clase}` : '');
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };

  const sol = (cx: number, cy: number, r: number) => (
    <g>
      <g className={anim('animate-girar-lento')} style={sobreSiMismo} stroke={SOL} strokeWidth={3} strokeLinecap="round">
        {Array.from({ length: 8 }, (_, i) => {
          const ang = (i * Math.PI) / 4;
          const [r1, r2] = [r + 5, r + 10];
          return (
            <line
              key={i}
              x1={cx + Math.cos(ang) * r1}
              y1={cy + Math.sin(ang) * r1}
              x2={cx + Math.cos(ang) * r2}
              y2={cy + Math.sin(ang) * r2}
            />
          );
        })}
      </g>
      <circle cx={cx} cy={cy} r={r} fill={SOL} />
    </g>
  );

  const luna = (cx: number, cy: number, r: number) => (
    <path
      d={`M${cx + r * 0.35} ${cy - r} a${r} ${r} 0 1 0 ${r * 0.65} ${r * 1.55} a${r * 0.8} ${r * 0.8} 0 0 1 -${r * 0.65} -${r * 1.55}z`}
      fill={LUNA}
    />
  );

  const astro = (cx: number, cy: number, r: number) => (esNoche ? luna(cx, cy, r) : sol(cx, cy, r));

  const nube = (dx = 0, dy = 0, color = NUBE, moverse = true) => (
    <g className={moverse ? anim('animate-flotar') : ''} fill={color} transform={`translate(${dx} ${dy})`}>
      <circle cx="24" cy="38" r="9" />
      <circle cx="35" cy="31" r="12" />
      <circle cx="46" cy="39" r="8" />
      <rect x="15" y="37" width="39" height="11" rx="5.5" />
    </g>
  );

  const gotas = (color: string, largo: number) => (
    <g stroke={color} strokeWidth={2.5} strokeLinecap="round">
      {[22, 32, 42].map((x, i) => (
        <line
          key={x}
          x1={x}
          y1={51}
          x2={x - 2}
          y2={51 + largo}
          className={anim('animate-caer')}
          style={{ animationDelay: `${i * 0.35}s` }}
        />
      ))}
    </g>
  );

  let contenido;
  switch (cielo) {
    case 'despejado':
      contenido = esNoche ? luna(32, 32, 16) : sol(32, 32, 12);
      break;
    case 'parcial':
      contenido = (
        <>
          {astro(23, 22, esNoche ? 11 : 8)}
          {nube(2, 4)}
        </>
      );
      break;
    case 'nubes':
      contenido = (
        <>
          {nube(6, -6, NUBE_OSCURA, false)}
          {nube(-2, 2)}
        </>
      );
      break;
    case 'llovizna':
      contenido = (
        <>
          {nube(0, -6)}
          {gotas('#7cc8f5', 4)}
        </>
      );
      break;
    case 'lluvia':
      contenido = (
        <>
          {nube(0, -6, '#d3dce6')}
          {gotas('#4fc3f7', 7)}
        </>
      );
      break;
    case 'tormenta':
      contenido = (
        <>
          {nube(0, -8, NUBE_OSCURA)}
          <path
            d="M34 40l-7 11h6l-3 9 10-13h-6l4-7z"
            fill={SOL}
            className={anim('animate-destello')}
          />
        </>
      );
      break;
    case 'nieve':
      contenido = (
        <>
          {nube(0, -6)}
          <g fill="#ffffff">
            {[22, 32, 42].map((x, i) => (
              <circle
                key={x}
                cx={x}
                cy={52}
                r={2.3}
                className={anim('animate-caer')}
                style={{ animationDelay: `${i * 0.4}s`, animationDuration: '2s' }}
              />
            ))}
          </g>
        </>
      );
      break;
    case 'niebla':
      contenido = (
        <g stroke={NUBE} strokeWidth={3.5} strokeLinecap="round">
          {[
            [14, 24, 46],
            [10, 33, 50],
            [16, 42, 44],
            [12, 51, 40],
          ].map(([x1, y, x2], i) => (
            <line
              key={y}
              x1={x1}
              y1={y}
              x2={x2}
              y2={y}
              opacity={i % 2 ? 0.7 : 1}
              className={anim('animate-flotar')}
              style={{ animationDelay: `${i * 0.5}s` }}
            />
          ))}
        </g>
      );
      break;
  }

  return (
    <svg viewBox="0 0 64 64" className={className} {...a11y}>
      {contenido}
    </svg>
  );
}
