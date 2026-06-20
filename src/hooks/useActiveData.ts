import { useMemo } from 'react';
import { useSvgFiles, useExcelFiles, useSvgContent, useExcelLots } from './useFiles';
import { useLotOverrides } from './useLotOverrides';
import { useUiStore } from '@/store/uiStore';
import { isDisponible, isVendido, nrm } from '@/config/lotStatus';
import type { Lot } from '@/types';

/**
 * Carga los datos activos de un proyecto: último plano SVG y último Excel
 * (o las versiones recordadas), ya descargados de Storage y parseados.
 * Devuelve también un índice de lotes por código para el visualizador.
 */
export function useActiveData(projectId: string | null) {
  const lastSvgId = useUiStore((s) => s.lastSvgId);
  const lastExcelId = useUiStore((s) => s.lastExcelId);

  const svgFilesQ = useSvgFiles(projectId);
  const excelFilesQ = useExcelFiles(projectId);

  const svgFiles = svgFilesQ.data ?? [];
  const excelFiles = excelFilesQ.data ?? [];

  const svgFile = svgFiles.find((f) => f.id === lastSvgId) ?? svgFiles[0] ?? null;
  const excelFile = excelFiles.find((f) => f.id === lastExcelId) ?? excelFiles[0] ?? null;

  const svgContentQ = useSvgContent(svgFile);
  const lotsQ = useExcelLots(excelFile);
  const overridesQ = useLotOverrides(projectId);

  const rawLots: Lot[] = lotsQ.data ?? [];
  const overrides = overridesQ.data;

  // Fusiona los cambios in-app (lot_overrides) sobre los datos del Excel.
  const lots = useMemo<Lot[]>(() => {
    if (!overrides || overrides.size === 0) return rawLots;
    return rawLots.map((l) => {
      const ov = overrides.get(nrm(l.id));
      if (!ov) return l;
      return {
        ...l,
        estado: ov.estado ?? l.estado,
        financiamiento: ov.financiamiento ?? l.financiamiento,
      };
    });
  }, [rawLots, overrides]);

  const lotsByCode = useMemo(() => {
    const m = new Map<string, Lot>();
    for (const l of lots) m.set(l.id, l);
    return m;
  }, [lots]);

  return {
    svgFile,
    excelFile,
    svgFiles,
    excelFiles,
    svgText: svgContentQ.data ?? null,
    lots,
    lotsByCode,
    isLoading: svgFilesQ.isLoading || excelFilesQ.isLoading,
    isLoadingSvg: svgContentQ.isLoading,
    isLoadingLots: lotsQ.isLoading,
    hasSvg: svgFiles.length > 0,
    hasExcel: excelFiles.length > 0,
  };
}

/* ─────────────── Estadísticas derivadas de los lotes ─────────────── */
export interface LotStats {
  total: number;
  byEstado: Record<string, number>;
  byFinanciamiento: Record<string, number>;
  vendidos: number;
  disponibles: number;
  reservados: number;
  valorVendido: number;
  valorTotal: number;
}

export function computeLotStats(lots: Lot[]): LotStats {
  const byEstado: Record<string, number> = {};
  const byFinanciamiento: Record<string, number> = {};
  let vendidos = 0;
  let disponibles = 0;
  let reservados = 0;
  let valorVendido = 0;
  let valorTotal = 0;

  for (const l of lots) {
    const estado = (l.estado || 'Sin estado').trim();
    byEstado[estado] = (byEstado[estado] ?? 0) + 1;
    if (l.financiamiento) {
      const f = l.financiamiento.trim();
      byFinanciamiento[f] = (byFinanciamiento[f] ?? 0) + 1;
    }
    if (isDisponible(estado)) disponibles++;
    if (isVendido(estado)) vendidos++;
    const k = nrm(estado);
    if (k === 'reservado' || k === 'separado') reservados++;
    if (l.precio) {
      valorTotal += l.precio;
      if (isVendido(estado)) valorVendido += l.precio;
    }
  }

  return { total: lots.length, byEstado, byFinanciamiento, vendidos, disponibles, reservados, valorVendido, valorTotal };
}
