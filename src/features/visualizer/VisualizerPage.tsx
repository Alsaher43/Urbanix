import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map, PanelRightClose, PanelRightOpen, Layers, FileUp } from 'lucide-react';
import { useActiveProject } from '@/hooks/useActiveProject';
import { useActiveData } from '@/hooks/useActiveData';
import { useAuth } from '@/context/AuthContext';
import { useColorFor } from '@/store/legendStore';
import { useSetLotStatus } from '@/hooks/useLotOverrides';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { SvgCanvas } from './SvgCanvas';
import { FilterLegend, type Facets, type FacetKey } from './FilterLegend';
import { LotTooltip } from './LotTooltip';
import { lotField } from '@/utils/lotFields';
import { nrm, ESTADO_ORDER, FINANCIAMIENTO_OPTIONS, uniqueByNorm } from '@/config/lotStatus';
import type { Lot } from '@/types';

const emptyFacets = (): Facets => ({ estado: new Set(), ubicacion: new Set(), financiamiento: new Set(), cuotas: new Set() });

export function VisualizerPage() {
  const { isManager } = useAuth();
  const { projectId, project, hasProjects } = useActiveProject();
  const { svgText, lots, lotsByCode, hasSvg, hasExcel, isLoadingSvg } = useActiveData(projectId);
  const colorFor = useColorFor();
  const setStatus = useSetLotStatus();

  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [facets, setFacets] = useState<Facets>(emptyFacets);

  const fsRef = useRef<HTMLDivElement>(null);

  const estadoOptions = useMemo(() => uniqueByNorm([...ESTADO_ORDER, ...lots.map((l) => l.estado)]), [lots]);
  const financiamientoOptions = useMemo(
    () => uniqueByNorm([...FINANCIAMIENTO_OPTIONS, ...lots.map((l) => l.financiamiento)]),
    [lots],
  );

  // Buscar selecciona el lote exacto (por id).
  useEffect(() => {
    const q = nrm(search);
    if (!q) return;
    const match = lots.find((l) => nrm(l.id) === q);
    if (match) setSelected(match.id);
  }, [search, lots]);

  const toggleFacet = useCallback((facet: FacetKey, value: string) => {
    const k = nrm(value);
    setFacets((prev) => {
      const next: Facets = {
        estado: new Set(prev.estado),
        ubicacion: new Set(prev.ubicacion),
        financiamiento: new Set(prev.financiamiento),
        cuotas: new Set(prev.cuotas),
      };
      next[facet].has(k) ? next[facet].delete(k) : next[facet].add(k);
      return next;
    });
  }, []);

  const clearFacets = useCallback(() => setFacets(emptyFacets()), []);

  // Color por estado.
  const getColor = useCallback((lot: Lot) => colorFor(lot.estado), [colorFor]);

  // Filtro facetado: OR dentro de cada faceta, AND entre facetas. Tiempo real.
  const isVisible = useCallback(
    (lot: Lot) => {
      const okE = facets.estado.size === 0 || facets.estado.has(nrm(lot.estado));
      const okU = facets.ubicacion.size === 0 || facets.ubicacion.has(nrm(lotField(lot, 'ubicacion')));
      const okF = facets.financiamiento.size === 0 || facets.financiamiento.has(nrm(lot.financiamiento || ''));
      const okC = facets.cuotas.size === 0 || facets.cuotas.has(nrm(lotField(lot, 'Cuotas')));
      return okE && okU && okF && okC;
    },
    [facets],
  );

  const selectedLot = selected ? lotsByCode.get(selected) ?? null : null;
  const hoverLot = hover ? lotsByCode.get(hover.id) ?? null : null;
  const canEdit = isManager && !!selectedLot && !!projectId;

  if (!hasProjects) {
    return <EmptyState icon={Map} title="Sin proyectos" description="Crea un proyecto y carga un plano SVG para visualizarlo." className="mt-10" />;
  }

  return (
    <div className="flex h-[calc(100vh-60px-2rem)] flex-col sm:h-[calc(100vh-60px-3rem)] lg:h-[calc(100vh-60px-4rem)]">
      <PageHeader
        title="Plano"
        description={project?.nombre}
        actions={
          <>
            <ProjectSwitcher />
            <Button variant="secondary" size="icon" onClick={() => setPanelOpen((o) => !o)} title={panelOpen ? 'Ocultar leyenda' : 'Mostrar leyenda'}>
              {panelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </Button>
          </>
        }
      />

      {!hasSvg ? (
        <EmptyState
          icon={Layers}
          title="No hay plano cargado"
          description={
            isManager
              ? 'Sube un plano SVG cuyos lotes tengan un id que coincida con la columna lote_id del Excel.'
              : 'Tu gerente aún no ha cargado el plano de este proyecto.'
          }
          action={isManager ? <Link to="/proyectos"><Button><FileUp className="h-4 w-4" /> Subir plano</Button></Link> : undefined}
          className="flex-1"
        />
      ) : (
        <div ref={fsRef} className="relative min-h-0 flex-1 bg-canvas">
          {isLoadingSvg || !svgText ? (
            <div className="flex h-full items-center justify-center rounded-xl border border-border bg-surface">
              <Spinner className="h-6 w-6" />
            </div>
          ) : (
            <>
              <SvgCanvas
                svgText={svgText}
                lots={lots}
                getColor={getColor}
                isVisible={isVisible}
                selected={selected}
                onSelect={setSelected}
                onHover={setHover}
                fullscreenTargetRef={fsRef}
              />

              {hover && hoverLot && <LotTooltip lot={hoverLot} colorFor={colorFor} x={hover.x} y={hover.y} />}

              {!hasExcel && (
                <div className="absolute left-4 top-4 z-10 rounded-md border border-warning/30 bg-warning/10 px-3 py-1.5 text-2xs font-medium text-warning">
                  Plano sin datos de Excel cargados.
                </div>
              )}

              {/* Leyenda flotante arrastrable sobre el plano (visible en pantalla completa) */}
              {panelOpen && (
                <FilterLegend
                  lots={lots}
                  colorFor={colorFor}
                  facets={facets}
                  onToggle={toggleFacet}
                  onClear={clearFacets}
                  search={search}
                  onSearch={setSearch}
                  selectedLot={selectedLot}
                  onClearSelection={() => setSelected(null)}
                  editable={isManager}
                  estadoOptions={estadoOptions}
                  financiamientoOptions={financiamientoOptions}
                  onChangeEstado={
                    canEdit
                      ? (estado) => setStatus.mutate({ projectId: projectId!, loteId: selectedLot!.id, estado, prevEstado: selectedLot!.estado })
                      : undefined
                  }
                  onChangeFinanciamiento={
                    canEdit
                      ? (financiamiento) =>
                          setStatus.mutate({
                            projectId: projectId!,
                            loteId: selectedLot!.id,
                            financiamiento: financiamiento || null,
                            prevFinanciamiento: selectedLot!.financiamiento,
                          })
                      : undefined
                  }
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
