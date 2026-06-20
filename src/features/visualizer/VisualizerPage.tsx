import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map, PanelRightClose, PanelRightOpen, Layers, FileUp } from 'lucide-react';
import { useActiveProject } from '@/hooks/useActiveProject';
import { useActiveData } from '@/hooks/useActiveData';
import { useAuth } from '@/context/AuthContext';
import { useColorFor } from '@/store/legendStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useSetLotStatus } from '@/hooks/useLotOverrides';
import { SvgCanvas } from './SvgCanvas';
import { LegendPanel } from './LegendPanel';
import { buildLegendValues } from './legendValues';
import { nrm, prettyLabel, ESTADO_ORDER, FINANCIAMIENTO_OPTIONS, uniqueByNorm, type Dimension } from '@/config/lotStatus';
import { cn } from '@/lib/cn';

export function VisualizerPage() {
  const { isManager } = useAuth();
  const { projectId, project, hasProjects } = useActiveProject();
  const { svgText, lots, lotsByCode, hasSvg, hasExcel, isLoadingSvg } = useActiveData(projectId);
  const colorFor = useColorFor();
  const setStatus = useSetLotStatus();

  const estadoOptions = useMemo(() => uniqueByNorm([...ESTADO_ORDER, ...lots.map((l) => l.estado)]), [lots]);
  const financiamientoOptions = useMemo(
    () => uniqueByNorm([...FINANCIAMIENTO_OPTIONS, ...lots.map((l) => l.financiamiento)]),
    [lots],
  );

  const [dimension, setDimension] = useState<Dimension>('estado');
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);
  const [mobileSheet, setMobileSheet] = useState(false);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [activeValues, setActiveValues] = useState<Set<string>>(new Set());

  const values = useMemo(() => buildLegendValues(lots, dimension), [lots, dimension]);

  // Al cambiar dimensión o datos, activa todos los valores.
  useEffect(() => {
    setActiveValues(new Set(values.map((v) => nrm(v.value))));
  }, [values]);

  // Buscar selecciona el lote exacto (por id).
  useEffect(() => {
    const q = nrm(search);
    if (!q) return;
    const match = lots.find((l) => nrm(l.id) === q);
    if (match) setSelected(match.id);
  }, [search, lots]);

  const toggleValue = (value: string) =>
    setActiveValues((prev) => {
      const next = new Set(prev);
      const k = nrm(value);
      next.has(k) ? next.delete(k) : next.add(k);
      return next.size === 0 ? new Set(values.map((v) => nrm(v.value))) : next;
    });

  const selectedLot = selected ? lotsByCode.get(selected) ?? null : null;
  const hoverLot = hover ? lotsByCode.get(hover.id) ?? null : null;

  const canEdit = isManager && !!selectedLot && !!projectId;
  const legendPanel = (
    <LegendPanel
      dimension={dimension}
      onDimensionChange={setDimension}
      values={values}
      colorFor={colorFor}
      activeValues={activeValues}
      onToggleValue={toggleValue}
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
  );

  const togglePanel = () => {
    if (window.matchMedia('(min-width: 768px)').matches) setPanelOpen((o) => !o);
    else setMobileSheet((o) => !o);
  };

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
            <Button variant="secondary" size="icon" onClick={togglePanel} title="Panel">
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
        <div className="flex min-h-0 flex-1 gap-4">
          <div className="relative min-w-0 flex-1">
            {isLoadingSvg || !svgText ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-border bg-surface">
                <Spinner className="h-6 w-6" />
              </div>
            ) : (
              <>
                <SvgCanvas
                  svgText={svgText}
                  lots={lots}
                  dimension={dimension}
                  colorFor={colorFor}
                  selected={selected}
                  activeValues={activeValues}
                  onSelect={setSelected}
                  onHover={setHover}
                />
                {hover && hoverLot && (
                  <div
                    className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-lg border border-border bg-surface px-3 py-2 shadow-lg animate-fade-in"
                    style={{ left: hover.x, top: hover.y }}
                  >
                    <p className="text-sm font-bold text-content">{hoverLot.id}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colorFor(hoverLot.estado) }} />
                      <span className="text-2xs text-content-2">{prettyLabel(hoverLot.estado)}</span>
                    </div>
                    {hoverLot.financiamiento && (
                      <p className="mt-0.5 text-2xs text-content-3">{prettyLabel(hoverLot.financiamiento)}</p>
                    )}
                  </div>
                )}
                {!hasExcel && (
                  <div className="absolute left-4 top-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-1.5 text-2xs font-medium text-warning">
                    Plano sin datos de Excel cargados.
                  </div>
                )}
              </>
            )}
          </div>

          {/* Panel lateral (escritorio) */}
          <aside
            className={cn(
              'hidden shrink-0 overflow-hidden rounded-xl border border-border bg-surface transition-all duration-200 ease-smooth md:block',
              panelOpen ? 'w-full max-w-xs p-4' : 'w-0 border-0 p-0',
            )}
          >
            {panelOpen && legendPanel}
          </aside>
        </div>
      )}

      {/* Panel inferior (móvil) */}
      {mobileSheet && hasSvg && (
        <div className="md:hidden">
          <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={() => setMobileSheet(false)} />
          <div className="fixed inset-x-0 bottom-0 z-40 max-h-[78vh] animate-fade-in-up overflow-y-auto rounded-t-2xl border-t border-border bg-surface p-4 shadow-xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" />
            {legendPanel}
          </div>
        </div>
      )}
    </div>
  );
}
