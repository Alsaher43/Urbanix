import type { Lot } from '@/types';
import { prettyLabel } from '@/config/lotStatus';
import { lotField } from '@/utils/lotFields';
import { formatCurrency, formatNumber } from '@/lib/format';

/**
 * Tooltip flotante moderno del lote. Muestra todos los campos reales del Excel
 * (lote_id, estado, ubicación, precio, descuento, financiamiento, cuotas, área,
 * manzana, etapa). Los ausentes no aparecen. Se posiciona vía `x`/`y`.
 */
export function LotTooltip({
  lot,
  colorFor,
  x,
  y,
}: {
  lot: Lot;
  colorFor: (value: string) => string;
  x: number;
  y: number;
}) {
  const estadoColor = colorFor(lot.estado);
  const ubicacion = lotField(lot, 'ubicacion');
  const cuotas = lotField(lot, 'Cuotas');

  const descuento =
    lot.descuento == null || lot.descuento === 0
      ? null
      : lot.descuento < 1
        ? `${Math.round(lot.descuento * 100)}%`
        : formatCurrency(lot.descuento);

  const rows: { label: string; value: string }[] = [];
  if (ubicacion) rows.push({ label: 'Ubicación', value: prettyLabel(ubicacion) });
  if (lot.financiamiento) rows.push({ label: 'Financiamiento', value: prettyLabel(lot.financiamiento) });
  if (cuotas) rows.push({ label: 'Cuotas', value: cuotas });
  if (lot.precio != null) rows.push({ label: 'Precio', value: formatCurrency(lot.precio) });
  if (descuento) rows.push({ label: 'Descuento', value: descuento });
  if (lot.area != null) rows.push({ label: 'Área', value: `${formatNumber(lot.area)} m²` });
  if (lot.manzana) rows.push({ label: 'Manzana', value: lot.manzana });
  if (lot.etapa) rows.push({ label: 'Etapa', value: prettyLabel(lot.etapa) });

  return (
    <div
      className="pointer-events-none absolute z-20 w-60 -translate-x-1/2 -translate-y-[calc(100%+14px)] animate-fade-in-up overflow-hidden rounded-xl border border-white/10 shadow-xl glass"
      style={{ left: x, top: y }}
    >
      <div className="h-1 w-full" style={{ backgroundColor: estadoColor }} />
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-bold tracking-tight text-content">{lot.id}</span>
          <span className="rounded-full px-2 py-0.5 text-2xs font-semibold text-white" style={{ backgroundColor: estadoColor }}>
            {prettyLabel(lot.estado) || '—'}
          </span>
        </div>
        {rows.length > 0 && (
          <dl className="mt-2.5 space-y-1.5">
            {rows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 text-xs">
                <dt className="text-content-3">{r.label}</dt>
                <dd className="truncate font-medium text-content">{r.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}
