import { useCallback, useState } from 'react';

/** Unidad de temperatura activa. La API siempre devuelve °C; la conversión es local. */
export function useUnit() {
  const [esCelsius, setEsCelsius] = useState(true);

  const alternar = useCallback(() => setEsCelsius((c) => !c), []);
  const reiniciar = useCallback(() => setEsCelsius(true), []);
  const conv = useCallback(
    (celsius: number) => (esCelsius ? Math.round(celsius) : Math.round((celsius * 9) / 5 + 32)),
    [esCelsius],
  );

  return { esCelsius, unidad: esCelsius ? '°' : '°F', conv, alternar, reiniciar };
}

export type Unit = ReturnType<typeof useUnit>;
