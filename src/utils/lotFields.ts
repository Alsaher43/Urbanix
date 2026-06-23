import type { Lot } from '@/types';

/**
 * Lee un campo de un lote por nombre, SIN modificar la lógica de carga del Excel.
 * Primero busca en los campos tipados; si no, en `extra` (columnas no mapeadas
 * como `ubicacion` o `Cuotas`), con coincidencia de clave sin distinguir
 * mayúsculas. Devuelve siempre string ('' si no existe).
 */
const TYPED: Record<string, (l: Lot) => unknown> = {
  lote_id: (l) => l.id,
  id: (l) => l.id,
  estado: (l) => l.estado,
  financiamiento: (l) => l.financiamiento,
  precio: (l) => l.precio,
  descuento: (l) => l.descuento,
  area: (l) => l.area,
  area_m2: (l) => l.area,
  manzana: (l) => l.manzana,
  etapa: (l) => l.etapa,
  subcategoria: (l) => l.subcategoria,
};

export function lotField(lot: Lot, name: string): string {
  const key = name.toLowerCase();
  const typed = TYPED[key];
  if (typed) {
    const v = typed(lot);
    return v == null ? '' : String(v);
  }
  for (const k of Object.keys(lot.extra)) {
    if (k.toLowerCase() === key) {
      const v = lot.extra[k];
      return v == null ? '' : String(v);
    }
  }
  return '';
}
