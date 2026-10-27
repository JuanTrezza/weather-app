/** true si el usuario pidió reducir el movimiento en su sistema (se lee en cada frame del globo) */
export const prefiereMenosMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
