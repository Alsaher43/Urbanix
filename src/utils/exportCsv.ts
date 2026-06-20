import type { Lot } from '@/types';

function escapeCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Exporta lotes a CSV (delimitador ; compatible con Excel ES) y descarga. */
export function exportLotsToCsv(lots: Lot[], fileName = 'urbanix-lotes.csv'): void {
  // Reúne todas las columnas extra presentes para no perder información.
  const extraKeys = Array.from(
    lots.reduce((set, l) => {
      Object.keys(l.extra).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );

  const headers = ['Lote', 'Estado', 'Financiamiento', 'Precio', ...extraKeys];
  const rows = lots.map((l) =>
    [
      l.id,
      l.estado,
      l.financiamiento ?? '',
      l.precio ?? '',
      ...extraKeys.map((k) => l.extra[k] ?? ''),
    ]
      .map(escapeCell)
      .join(';'),
  );

  const csv = '﻿' + [headers.join(';'), ...rows].join('\r\n');
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), fileName);
}

export function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
