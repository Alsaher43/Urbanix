import type { Lot } from '@/types';
import { nrm, type Dimension } from '@/config/lotStatus';

/**
 * Motor de coloreado del plano SVG (alineado con el Valora real). El `lote_id`
 * del Excel coincide con el `id` de la forma en el SVG — sin prefijo obligatorio.
 * El matching es tolerante: normaliza y prueba prefijos comunes (lote, mz…).
 */

const SKIP_FILL = new Set(['text', 'tspan', 'defs', 'style']);
const ID_PREFIXES = ['fill', 'lote', 'lot', 'l', 'id', 'mz', 'manzana', 'lt', 'parcela'];

/** Construye un índice normalizado de los elementos con id del SVG. */
export function buildSvgIndex(svg: SVGElement): Map<string, SVGElement> {
  const map = new Map<string, SVGElement>();
  svg.querySelectorAll<SVGElement>('[id]').forEach((el) => {
    if (el.closest('defs') || el.closest('symbol')) return;
    const id = (el.id || '').trim();
    if (id) map.set(nrm(id), el);
  });
  return map;
}

/** Encuentra el elemento del lote por id, con tolerancia a prefijos. */
export function findLotElement(index: Map<string, SVGElement>, rawId: string): SVGElement | null {
  const key = nrm(rawId);
  if (!key) return null;
  if (index.has(key)) return index.get(key)!;
  for (const p of ID_PREFIXES) {
    if (index.has(p + key)) return index.get(p + key)!;
  }
  // último intento: id que termina igual quitando prefijos
  for (const [k, el] of index) {
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
  /** Valores normalizados activos (filtro). Si se define, el resto se atenúa. */
  activeValues?: Set<string> | null;
}

/** Devuelve el valor de la dimensión activa para un lote. */
export function valueOf(lot: Lot, dimension: Dimension): string {
  return dimension === 'estado' ? lot.estado : lot.financiamiento ?? '';
}

/** Colorea el SVG a partir de los lotes y la dimensión elegida. */
export function applyLotColors(
  svg: SVGElement,
  lots: Lot[],
  dimension: Dimension,
  colorFor: (value: string) => string,
  options: ApplyOptions = {},
): { matched: number; total: number; indexed: number } {
  const index = buildSvgIndex(svg);
  let matched = 0;

  for (const lot of lots) {
    const el = findLotElement(index, lot.id);
    if (!el) continue;
    matched++;

    const value = valueOf(lot, dimension);
    setFill(el, colorFor(value));
    el.style.cursor = 'pointer';
    el.dataset.lid = lot.id;
    el.dataset.val = value;

    const filtered = options.activeValues && value && !options.activeValues.has(nrm(value));
    const selected = options.selected === lot.id;

    el.style.opacity = filtered ? '0.07' : '1';
    el.style.stroke = selected ? 'rgb(99,102,241)' : '';
    el.style.strokeWidth = selected ? '2.5' : '';
  }

  return { matched, total: lots.length, indexed: index.size };
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
