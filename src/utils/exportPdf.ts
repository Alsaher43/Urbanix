import type { Lot } from '@/types';
import { prettyLabel } from '@/config/lotStatus';
import { formatCurrency } from '@/lib/format';

const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Genera un reporte de lotes imprimible (→ PDF vía el diálogo de impresión del
 * navegador). Sin dependencias: abre una ventana con HTML y lanza window.print().
 * Devuelve false si el navegador bloqueó la ventana emergente.
 */
export function exportLotsToPdf(
  lots: Lot[],
  projectName: string,
  colorFor: (value: string) => string,
): boolean {
  const total = lots.length;
  const date = new Date().toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

  // Resumen por estado
  const counts: Record<string, number> = {};
  lots.forEach((l) => {
    const e = (l.estado || 'Sin estado').trim();
    counts[e] = (counts[e] ?? 0) + 1;
  });
  const summary = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `<span class="pc"><i style="background:${colorFor(k)}"></i>${esc(prettyLabel(k))}: <b>${v}</b></span>`)
    .join('');

  // Columnas extra presentes
  const extraKeys = Array.from(
    lots.reduce((set, l) => {
      Object.keys(l.extra).forEach((k) => { if (l.extra[k] != null && l.extra[k] !== '') set.add(k); });
      return set;
    }, new Set<string>()),
  );
  const headers = ['Lote', 'Estado', 'Financiamiento', 'Precio', ...extraKeys];

  const LIMIT = 1500;
  const shown = lots.slice(0, LIMIT);
  const rows = shown
    .map(
      (l) =>
        `<tr><td><b>${esc(l.id)}</b></td><td><span class="dot" style="background:${colorFor(l.estado)}"></span>${esc(prettyLabel(l.estado))}</td><td>${l.financiamiento ? esc(prettyLabel(l.financiamiento)) : '—'}</td><td>${l.precio != null ? esc(formatCurrency(l.precio)) : '—'}</td>${extraKeys.map((k) => `<td>${esc(l.extra[k] ?? '')}</td>`).join('')}</tr>`,
    )
    .join('');
  const trunc = total > LIMIT ? `<div class="nt">Mostrando ${LIMIT} de ${total} lotes. Usa CSV para el listado completo.</div>` : '';

  const styles = `*{margin:0;padding:0;box-sizing:border-box}body{font-family:Inter,Arial,sans-serif;color:#0f172a;padding:28px}
  .hd{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #5850EC;padding-bottom:14px;margin-bottom:18px}
  .br{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:800;letter-spacing:.3px}
  .mt{text-align:right;font-size:11px;color:#64748b}.mt b{display:block;font-size:13px;color:#0f172a}
  .sm{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px}
  .pc{display:inline-flex;align-items:center;gap:6px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:20px;padding:5px 12px;font-size:11.5px}
  .pc i{width:9px;height:9px;border-radius:2px;display:inline-block}
  table{width:100%;border-collapse:collapse;font-size:10.5px}
  th{background:#5850EC;color:#fff;text-align:left;padding:7px 9px;font-size:9px;text-transform:uppercase;letter-spacing:.4px}
  td{padding:6px 9px;border-bottom:1px solid #e2e8f0}tr:nth-child(even) td{background:#f8fafc}
  .dot{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;vertical-align:middle}
  .nt{font-size:10px;color:#92400e;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;margin-bottom:12px}
  .ft{margin-top:18px;font-size:9.5px;color:#94a3b8;text-align:center}@media print{body{padding:16px}}`;

  const logo = '<svg width="22" height="22" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="8" fill="#5850EC"/><path d="M8 22V11.5C8 10.67 8.67 10 9.5 10h4c.83 0 1.5.67 1.5 1.5V22M17 22v-7.5c0-.83.67-1.5 1.5-1.5h4c.83 0 1.5.67 1.5 1.5V22M6 22.5h20" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>';

  const body = `<div class="hd"><div class="br">${logo}URBANIX</div><div class="mt"><b>Reporte de Lotes</b>${esc(projectName)}<br>${date} · ${total} lotes</div></div>
  <div class="sm">${summary}</div>${trunc}
  <table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
  <div class="ft">Generado por Urbanix · ${date}</div>`;

  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Urbanix · Reporte de Lotes</title><style>${styles}</style></head><body>${body}<script>window.onload=function(){setTimeout(function(){window.print();},300);};<\/script></body></html>`,
  );
  w.document.close();
  return true;
}
