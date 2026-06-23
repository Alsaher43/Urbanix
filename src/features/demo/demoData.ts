import type { Lot } from '@/types';
import { nrm } from '@/config/lotStatus';

/**
 * Datos de ejemplo para el Modo Demo (sin backend). Una sola fuente genera el
 * plano SVG (cada lote es una forma con id = lote_id) y la lista de lotes,
 * con el modelo real de Valora: estado + financiamiento.
 */
interface DemoEntry {
  id: string;
  x: number;
  y: number;
  estado: string;
  financiamiento: string | null;
  precio: number;
  cliente: string | null;
}

const LOT_W = 72;
const LOT_H = 96;

const DEMO: DemoEntry[] = [
  // ── Manzana A ──
  { id: 'A-1', x: 40, y: 80, estado: 'Disponible', financiamiento: 'Financiamiento Directo', precio: 18500, cliente: null },
  { id: 'A-2', x: 118, y: 80, estado: 'Vendido', financiamiento: 'Contado', precio: 19200, cliente: 'Juan Pérez' },
  { id: 'A-3', x: 196, y: 80, estado: 'Vendido', financiamiento: 'Financiamiento Directo', precio: 21000, cliente: 'María Gómez' },
  { id: 'A-4', x: 274, y: 80, estado: 'Reservado', financiamiento: 'Financiamiento Directo', precio: 17800, cliente: 'Pedro Salas' },
  { id: 'A-5', x: 352, y: 80, estado: 'Disponible', financiamiento: 'Financiamiento Directo', precio: 20500, cliente: null },
  { id: 'A-6', x: 40, y: 176, estado: 'Bloqueado', financiamiento: null, precio: 18900, cliente: null },
  { id: 'A-7', x: 118, y: 176, estado: 'Vendido', financiamiento: 'Contado', precio: 22500, cliente: 'Ana Torres' },
  { id: 'A-8', x: 196, y: 176, estado: 'Disponible', financiamiento: 'Financiamiento Directo', precio: 16500, cliente: null },
  { id: 'A-9', x: 274, y: 176, estado: 'Reservado', financiamiento: 'Contado', precio: 19800, cliente: 'Luis Vega' },
  { id: 'A-10', x: 352, y: 176, estado: 'Vendido', financiamiento: 'Financiamiento Directo', precio: 15900, cliente: 'Rosa Díaz' },
  // ── Manzana M ──
  { id: 'M-1', x: 40, y: 360, estado: 'Disponible', financiamiento: 'Financiamiento Directo', precio: 24000, cliente: null },
  { id: 'M-2', x: 118, y: 360, estado: 'Vendido', financiamiento: 'Contado', precio: 25500, cliente: 'Elena Mora' },
  { id: 'M-3', x: 196, y: 360, estado: 'Separado', financiamiento: 'Financiamiento Directo', precio: 28000, cliente: 'Carlos Ruiz' },
  { id: 'M-4', x: 274, y: 360, estado: 'Disponible', financiamiento: 'Financiamiento Directo', precio: 23800, cliente: null },
  { id: 'M-5', x: 40, y: 456, estado: 'Reservado', financiamiento: 'Financiamiento Directo', precio: 22900, cliente: 'Sofía Lara' },
  { id: 'M-6', x: 118, y: 456, estado: 'Vendido', financiamiento: 'Contado', precio: 26100, cliente: 'Diego Núñez' },
  { id: 'M-7', x: 196, y: 456, estado: 'Disponible', financiamiento: 'Financiamiento Directo', precio: 24700, cliente: null },
  { id: 'M-8', x: 274, y: 456, estado: 'Vendido', financiamiento: 'Financiamiento Directo', precio: 29500, cliente: 'Marta Ríos' },
];

export function getDemoLots(): Lot[] {
  return DEMO.map((d) => {
    const [manzana, numStr] = d.id.split('-');
    const numero = Number(numStr) || 0;
    return {
      id: d.id,
      estado: d.estado,
      financiamiento: d.financiamiento,
      precio: d.precio,
      descuento: nrm(d.financiamiento) === 'contado' ? 800 : 0,
      area: 120 + numero * 8,
      manzana,
      etapa: manzana === 'A' ? 'Etapa 1' : 'Etapa 2',
      extra: { Cliente: d.cliente },
    } satisfies Lot;
  });
}

/** Genera un plano SVG de ejemplo; cada lote es una forma con id = lote_id. */
export function buildDemoSvg(): string {
  const lots = DEMO.map((d) => {
    const cx = d.x + LOT_W / 2;
    const cy = d.y + LOT_H / 2;
    return `
    <rect id="${d.id}" x="${d.x}" y="${d.y}" width="${LOT_W}" height="${LOT_H}" rx="2"
      fill="#ffffff" stroke="#9aa0ac" stroke-width="1" />
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="middle"
      font-family="Inter, sans-serif" font-size="15" font-weight="700" fill="#1b2330"
      pointer-events="none">${d.id}</text>`;
  }).join('');

  return `<svg viewBox="0 0 472 600" xmlns="http://www.w3.org/2000/svg" font-family="Inter, sans-serif">
    <text x="40" y="64" font-size="16" font-weight="800" fill="#5a606c">MZ. A</text>
    <text x="40" y="344" font-size="16" font-weight="800" fill="#5a606c">MZ. M</text>
    <text x="236" y="312" text-anchor="middle" font-size="12" font-weight="700"
      letter-spacing="2" fill="#b0b5c0">— CALLE LOS JARDINES —</text>
    <text x="236" y="540" text-anchor="middle" font-size="11" font-weight="600"
      letter-spacing="1" fill="#cdd1da">URBANIZACIÓN LAS PALMAS · PLANO DE EJEMPLO</text>
    ${lots}
  </svg>`;
}
