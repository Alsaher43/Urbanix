import type { Lot } from '@/types';

// `xlsx` es pesado (~400 kB): se carga de forma diferida solo cuando se
// procesa un archivo, manteniendo ligero el bundle inicial.
type XLSXModule = typeof import('xlsx');
let xlsxPromise: Promise<XLSXModule> | null = null;
function loadXLSX(): Promise<XLSXModule> {
  if (!xlsxPromise) xlsxPromise = import('xlsx');
  return xlsxPromise;
}

/** Detecta una columna por palabras clave (primera coincidencia por substring). */
function detectColumn(headers: string[], keywords: string[]): string | null {
  const lower = headers.map((h) => h.toLowerCase());
  for (const kw of keywords) {
    const i = lower.findIndex((h) => h.includes(kw));
    if (i >= 0) return headers[i];
  }
  return null;
}

const DETECT = {
  id: ['lote_id', 'id', 'lote', 'cod', 'num', 'manz', 'lot', 'nro'],
  estado: ['estado', 'status', 'condicion', 'disponib', 'situacion'],
  precio: ['precio', 'price', 'valor', 'monto'],
  financiamiento: ['financ', 'pago', 'modalidad'],
};

export interface DetectedColumns {
  id: string | null;
  estado: string | null;
  precio: string | null;
  financiamiento: string | null;
}

export interface ParseResult {
  lots: Lot[];
  columns: DetectedColumns;
  headers: string[];
  warnings: string[];
}

function toNumber(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = parseFloat(String(v).replace(/[^\d.,-]/g, '').replace(/,/g, ''));
  return Number.isNaN(n) ? null : n;
}

/** Parsea un ArrayBuffer (xlsx/xls/csv) a una lista flexible de lotes. */
export async function parseSpreadsheet(buffer: ArrayBuffer, fileName = ''): Promise<ParseResult> {
  const XLSX = await loadXLSX();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const empty: ParseResult = { lots: [], columns: { id: null, estado: null, precio: null, financiamiento: null }, headers: [], warnings: [] };
  if (!sheetName) return { ...empty, warnings: ['El archivo no contiene hojas.'] };

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' });
  if (raw.length === 0) return { ...empty, warnings: ['No hay datos debajo del encabezado.'] };

  // Normaliza claves (trim) y valores a string.
  const rows = raw.map((row) => {
    const o: Record<string, string> = {};
    Object.keys(row).forEach((k) => {
      o[String(k).trim()] = String(row[k] ?? '').trim();
    });
    return o;
  });

  const headers = Object.keys(rows[0]);
  const columns: DetectedColumns = {
    id: detectColumn(headers, DETECT.id) ?? headers[0] ?? null,
    estado: detectColumn(headers, DETECT.estado) ?? headers[Math.min(1, headers.length - 1)] ?? null,
    precio: detectColumn(headers, DETECT.precio),
    financiamiento: detectColumn(headers, DETECT.financiamiento),
  };

  const warnings: string[] = [];
  if (!columns.id) warnings.push('No se detectó la columna de identificador del lote.');
  if (!columns.estado) warnings.push('No se detectó la columna de estado.');

  const knownCols = new Set([columns.id, columns.estado, columns.precio, columns.financiamiento].filter(Boolean) as string[]);

  const lots: Lot[] = rows
    .map((row) => {
      const id = columns.id ? row[columns.id]?.trim() : '';
      if (!id) return null;
      const extra: Record<string, string | number | null> = {};
      headers.forEach((h) => {
        if (!knownCols.has(h) && h) extra[h] = row[h] ?? null;
      });
      return {
        id,
        estado: columns.estado ? row[columns.estado] || '' : '',
        financiamiento: columns.financiamiento ? row[columns.financiamiento] || null : null,
        precio: columns.precio ? toNumber(row[columns.precio]) : null,
        extra,
      } as Lot;
    })
    .filter((l): l is Lot => l !== null);

  if (lots.length === 0) warnings.push(`No se reconocieron lotes en "${fileName || 'el archivo'}".`);

  return { lots, columns, headers, warnings };
}

export async function parseSpreadsheetFile(file: File): Promise<ParseResult> {
  return parseSpreadsheet(await file.arrayBuffer(), file.name);
}
