import type { Lot } from '@/types';
import { nrm } from '@/config/lotStatus';

/**
 * Motor de coloreado del plano SVG (alineado con el Valora real). El `lote_id`
 * del Excel coincide con el `id` de la forma en el SVG — sin prefijo obligatorio.
 * El matching es tolerante: normaliza y prueba prefijos comunes (lote, mz…).
 */

const SKIP_FILL = new Set(['text', 'tspan', 'defs', 'style']);
const ID_PREFIXES = ['fill', 'lote', 'lot', 'l', 'id', 'mz', 'manzana', 'lt', 'parcela'];

export interface SvgIndex {
  /** Coincidencia exacta (minúsculas, preserva guiones) — prioritaria. */
  exact: Map<string, SVGElement>;
  /** Coincidencia laxa (normalizada) — para prefijos tipo FILL_. */
  loose: Map<string, SVGElement>;
}

const lc = (s: string) => s.toLowerCase().trim();

/** Construye índices (exacto + laxo) de los elementos con id del SVG. */
export function buildSvgIndex(svg: SVGElement): SvgIndex {
  const exact = new Map<string, SVGElement>();
  const loose = new Map<string, SVGElement>();
  svg.querySelectorAll<SVGElement>('[id]').forEach((el) => {
    if (el.closest('defs') || el.closest('symbol')) return;
    const id = (el.id || '').trim();
    if (!id) return;
    if (!exact.has(lc(id))) exact.set(lc(id), el);
    const k = nrm(id);
    if (k && !loose.has(k)) loose.set(k, el);
  });
  return { exact, loose };
}

/**
 * Encuentra el elemento del lote. Prioriza coincidencia EXACTA (preservando
 * guiones, p. ej. "H1-12" ≠ "H11-2"); si no, usa la laxa con prefijos (FILL_…).
 */
export function findLotElement(index: SvgIndex, rawId: string): SVGElement | null {
  const exact = index.exact.get(lc(rawId));
  if (exact) return exact;

  const key = nrm(rawId);
  if (!key) return null;
  if (index.loose.has(key)) return index.loose.get(key)!;
  for (const p of ID_PREFIXES) {
    if (index.loose.has(p + key)) return index.loose.get(p + key)!;
  }
  for (const [k, el] of index.loose) {
    if (k.replace(new RegExp('^(' + ID_PREFIXES.join('|') + ')'), '') === key) return el;
  }
  return null;
}

/** Aplica un color de relleno al elemento y a sus descendientes coloreables. */
function setFill(el: SVGElement, color: string) {
  const apply = (e: Element) => {
    const tag = (e.tagName || '').toLowerCase();
    if (SKIP_FILL.has(tag)) return;
    if (e.getAttribute('fill') === 'none') return;
    e.setAttribute('fill', color);
    (e as SVGElement).style.fill = color;
  };
  apply(el);
  el.querySelectorAll('path,rect,polygon,circle,ellipse').forEach(apply);
  el.style.transition = 'opacity .14s ease, fill .14s ease';
}

export interface ApplyOptions {
  selected?: string | null;
}

/**
 * Colorea el SVG. `getColor` decide el color de cada lote (p. ej. por estado);
 * `isVisible` decide si el lote pasa los filtros activos (si no, se atenúa).
 * Desacopla color y filtrado para soportar filtros facetados combinables.
 */
export function applyLotColors(
  svg: SVGElement,
  lots: Lot[],
  getColor: (lot: Lot) => string,
  isVisible: (lot: Lot) => boolean,
  options: ApplyOptions = {},
): { matched: number; total: number; indexed: number } {
  const index = buildSvgIndex(svg);
  let matched = 0;

  for (const lot of lots) {
    const el = findLotElement(index, lot.id);
    if (!el) continue;
    matched++;

    setFill(el, getColor(lot));
    el.style.cursor = 'pointer';
    el.dataset.lid = lot.id;

    const visible = isVisible(lot);
    const selected = options.selected === lot.id;

    el.style.opacity = visible ? '1' : '0.07';
    el.style.stroke = selected ? 'rgb(99,102,241)' : '';
    el.style.strokeWidth = selected ? '2.5' : '';
  }

  return { matched, total: lots.length, indexed: index.exact.size };
}

/** Sanea un SVG subido por el usuario: elimina <script> y handlers on*. */
export function sanitizeSvg(svgText: string): string {
  const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
  const root = doc.documentElement;
  root.querySelectorAll('script').forEach((n) => n.remove());
  root.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((attr) => {
      if (/^on/i.test(attr.name) || /javascript:/i.test(attr.value)) el.removeAttribute(attr.name);
    });
  });
  return new XMLSerializer().serializeToString(root);
}
