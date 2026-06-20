/**
 * ════════════════════════════════════════════════════════════════
 *  MODELO DE LEYENDA (alineado con el Valora real · valora-pro)
 *
 *  Dos dimensiones de color para los lotes:
 *    • Estado          → Disponible/Libre, Vendido, Reservado/Separado, Bloqueado
 *    • Financiamiento  → Contado, Financiamiento Directo (Directo)
 *
 *  Es data-driven: los valores salen del Excel. Los valores conocidos tienen
 *  un color semántico fijo; los desconocidos reciben un color estable de paleta.
 *  Colores tomados literalmente del Valora original para conservar el significado.
 * ════════════════════════════════════════════════════════════════
 */

export type Dimension = 'estado' | 'financiamiento';

export const DIMENSIONS: { key: Dimension; label: string; icon: string }[] = [
  { key: 'estado', label: 'Estados', icon: 'circle' },
  { key: 'financiamiento', label: 'Financiamiento', icon: 'wallet' },
];

/** Normaliza: minúsculas, sin acentos, solo alfanumérico (equiv. a `nrm` de Valora). */
export function nrm(s: unknown): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** Colores semánticos conocidos (clave normalizada → hex). */
export const KNOWN_COLORS: Record<string, string> = {
  // Estados
  disponible: '#10B981',
  libre: '#10B981',
  vendido: '#EF4444',
  reservado: '#F59E0B',
  separado: '#F59E0B',
  bloqueado: '#94A3B8',
  // Financiamiento
  contado: '#10B981',
  directo: '#3B82F6',
  financiamientodirecto: '#3B82F6',
  financiamiento: '#3B82F6',
};

/** Paleta determinista de respaldo para valores no reconocidos. */
export const PALETTE = ['#8B5CF6', '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#0F766E', '#2563EB', '#C026D3'];

export const NEUTRAL = '#94A3B8';

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Color por defecto de un valor: semántico si es conocido, si no de la paleta. */
export function defaultColorFor(value: string): string {
  const k = nrm(value);
  if (!k) return NEUTRAL;
  return KNOWN_COLORS[k] ?? PALETTE[hashStr(k) % PALETTE.length];
}

/** "financiamiento directo" / "VENDIDO" → "Financiamiento Directo" / "Vendido". */
export function prettyLabel(value: string): string {
  const t = String(value ?? '').trim();
  if (!t) return '—';
  return t
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Orden preferido de estados conocidos (para KPIs y leyenda). */
export const ESTADO_ORDER = ['Disponible', 'Libre', 'Vendido', 'Reservado', 'Separado', 'Bloqueado'];

/** Leyendas editables que se muestran en Configuración (las "fijas" de negocio). */
export const EDITABLE_LEGEND: { dimension: Dimension; label: string; sample: string }[] = [
  { dimension: 'estado', label: 'Disponible', sample: 'disponible' },
  { dimension: 'estado', label: 'Vendido', sample: 'vendido' },
  { dimension: 'estado', label: 'Reservado', sample: 'reservado' },
  { dimension: 'estado', label: 'Separado', sample: 'separado' },
  { dimension: 'estado', label: 'Bloqueado', sample: 'bloqueado' },
  { dimension: 'financiamiento', label: 'Contado', sample: 'contado' },
  { dimension: 'financiamiento', label: 'Financiamiento Directo', sample: 'directo' },
];

/** ¿El estado cuenta como disponible (no colocado)? */
export function isDisponible(estado: string | null | undefined): boolean {
  const k = nrm(estado);
  return k === 'disponible' || k === 'libre';
}

/** ¿El estado cuenta como vendido? */
export function isVendido(estado: string | null | undefined): boolean {
  return nrm(estado) === 'vendido';
}

/** Dedupe por valor normalizado conservando el primer texto visto y el orden. */
export function uniqueByNorm(values: (string | null | undefined)[]): string[] {
  const map = new Map<string, string>();
  for (const v of values) {
    const t = (v ?? '').trim();
    const k = nrm(t);
    if (k && !map.has(k)) map.set(k, t);
  }
  return [...map.values()];
}

/** Opciones canónicas de financiamiento (las "fijas"). */
export const FINANCIAMIENTO_OPTIONS = ['Contado', 'Financiamiento Directo'];
