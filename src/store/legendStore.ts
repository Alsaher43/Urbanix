import { useMemo } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nrm, defaultColorFor } from '@/config/lotStatus';

interface LegendState {
  /** Overrides de color por valor normalizado (ej. "vendido" → "#EF4444"). */
  overrides: Record<string, string>;
  setColor: (value: string, color: string) => void;
  reset: () => void;
}

/**
 * Leyenda configurable (requisito "cambiar colores"). Persiste en el navegador.
 * Los colores se asocian al valor normalizado, así que "Vendido", "vendido" y
 * "VENDIDO" comparten color.
 */
export const useLegendStore = create<LegendState>()(
  persist(
    (set) => ({
      overrides: {},
      setColor: (value, color) =>
        set((s) => ({ overrides: { ...s.overrides, [nrm(value)]: color } })),
      reset: () => set({ overrides: {} }),
    }),
    { name: 'urbanix.legend.v2' },
  ),
);

/**
 * Devuelve un resolvedor de color que respeta los overrides del usuario y,
 * si no hay, usa el color semántico/por defecto del valor.
 */
export function useColorFor(): (value: string) => string {
  const overrides = useLegendStore((s) => s.overrides);
  return useMemo(
    () => (value: string) => overrides[nrm(value)] ?? defaultColorFor(value),
    [overrides],
  );
}
