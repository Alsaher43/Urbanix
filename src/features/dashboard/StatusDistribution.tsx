import { useColorFor } from '@/store/legendStore';
import { nrm, ESTADO_ORDER, prettyLabel } from '@/config/lotStatus';
import { formatNumber, formatPercent } from '@/lib/format';
import type { LotStats } from '@/hooks/useActiveData';

const RANK = new Map(ESTADO_ORDER.map((l, i) => [nrm(l), i]));

/** Barra de distribución proporcional + leyenda con conteos, por estado. */
export function StatusDistribution({ stats }: { stats: LotStats }) {
  const colorFor = useColorFor();
  const total = stats.total || 1;

  const entries = Object.entries(stats.byEstado).sort((a, b) => {
    const ra = RANK.get(nrm(a[0])) ?? 999;
    const rb = RANK.get(nrm(b[0])) ?? 999;
    return ra - rb || b[1] - a[1];
  });

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-2">
        {entries.map(([estado, count]) => (
          <div
            key={estado}
            className="h-full transition-all duration-500"
            style={{ width: `${(count / total) * 100}%`, backgroundColor: colorFor(estado) }}
            title={`${prettyLabel(estado)}: ${count}`}
          />
        ))}
      </div>

      <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {entries.map(([estado, count]) => (
          <li key={estado} className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="h-3 w-3 shrink-0 rounded-sm ring-1 ring-black/10" style={{ backgroundColor: colorFor(estado) }} />
              <span className="truncate text-sm text-content-2">{prettyLabel(estado)}</span>
            </div>
            <div className="flex shrink-0 items-baseline gap-2">
              <span className="text-sm font-semibold text-content">{formatNumber(count)}</span>
              <span className="text-2xs text-content-3">{formatPercent(count / total, 0)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
