import type { Lot } from '@/types';
import { nrm, ESTADO_ORDER, type Dimension } from '@/config/lotStatus';
import type { LegendValue } from './LegendPanel';

const ESTADO_RANK = new Map(ESTADO_ORDER.map((label, i) => [nrm(label), i]));

/** Construye la lista de valores (con conteo) de una dimensión, ordenada. */
export function buildLegendValues(lots: Lot[], dimension: Dimension): LegendValue[] {
  const counts = new Map<string, number>();
  for (const lot of lots) {
    const raw = (dimension === 'estado' ? lot.estado : lot.financiamiento ?? '').trim();
    if (!raw) continue;
    counts.set(raw, (counts.get(raw) ?? 0) + 1);
  }

  const items: LegendValue[] = [...counts.entries()].map(([value, count]) => ({ value, count }));

  if (dimension === 'estado') {
    items.sort((a, b) => {
      const ra = ESTADO_RANK.get(nrm(a.value)) ?? 999;
      const rb = ESTADO_RANK.get(nrm(b.value)) ?? 999;
      return ra - rb || b.count - a.count || a.value.localeCompare(b.value);
    });
  } else {
    items.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
  }

  return items;
}
