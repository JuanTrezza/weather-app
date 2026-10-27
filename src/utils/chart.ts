export interface Punto {
  x: number;
  y: number;
}

/**
 * Curva suave que pasa por todos los puntos sin "pasarse" de los valores reales
 * (interpolación cúbica monótona de Fritsch–Carlson), como path SVG.
 */
export function curvaSuave(puntos: Punto[]): string {
  const n = puntos.length;
  if (n === 0) return '';
  const [p0] = puntos as [Punto];
  if (n === 1) return `M${p0.x} ${p0.y}`;

  const dx: number[] = [];
  const pendientes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = puntos[i + 1]!.x - puntos[i]!.x;
    pendientes[i] = (puntos[i + 1]!.y - puntos[i]!.y) / dx[i]!;
  }

  // Tangente en cada punto: 0 en picos y valles, media armónica en el resto
  const tangentes = puntos.map((_, i) => {
    if (i === 0) return pendientes[0]!;
    if (i === n - 1) return pendientes[n - 2]!;
    const [a, b] = [pendientes[i - 1]!, pendientes[i]!];
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  });

  let d = `M${p0.x} ${p0.y}`;
  for (let i = 0; i < n - 1; i++) {
    const [p, q] = [puntos[i]!, puntos[i + 1]!];
    const h = dx[i]! / 3;
    d += ` C${p.x + h} ${p.y + tangentes[i]! * h} ${q.x - h} ${q.y - tangentes[i + 1]! * h} ${q.x} ${q.y}`;
  }
  return d;
}
