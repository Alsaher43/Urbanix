import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, CheckCircle2, Home, TrendingUp, ArrowLeft, Sparkles } from 'lucide-react';
import { SvgCanvas } from '@/features/visualizer/SvgCanvas';
import { LegendPanel } from '@/features/visualizer/LegendPanel';
import { LotTooltip } from '@/features/visualizer/LotTooltip';
import { buildLegendValues } from '@/features/visualizer/legendValues';
import { KpiCard } from '@/features/dashboard/KpiCard';
import { StatusDistribution } from '@/features/dashboard/StatusDistribution';
import { computeLotStats } from '@/hooks/useActiveData';
import { useColorFor } from '@/store/legendStore';
import { nrm, ESTADO_ORDER, FINANCIAMIENTO_OPTIONS, uniqueByNorm, type Dimension } from '@/config/lotStatus';
import type { Lot } from '@/types';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getDemoLots, buildDemoSvg } from './demoData';
import { formatNumber, formatPercent } from '@/lib/format';

export function DemoPage() {
  const colorFor = useColorFor();
  const [lots, setLots] = useState<Lot[]>(() => getDemoLots());
  const svgText = useMemo(() => buildDemoSvg(), []);
  const lotsByCode = useMemo(() => new Map(lots.map((l) => [l.id, l])), [lots]);
  const stats = useMemo(() => computeLotStats(lots), [lots]);
  const estadoOptions = useMemo(() => uniqueByNorm([...ESTADO_ORDER, ...lots.map((l) => l.estado)]), [lots]);
  const financiamientoOptions = useMemo(
    () => uniqueByNorm([...FINANCIAMIENTO_OPTIONS, ...lots.map((l) => l.financiamiento)]),
    [lots],
  );

  const updateLot = (id: string, patch: Partial<Lot>) =>
    setLots((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const [dimension, setDimension] = useState<Dimension>('estado');
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [activeValues, setActiveValues] = useState<Set<string>>(new Set());

  const values = useMemo(() => buildLegendValues(lots, dimension), [lots, dimension]);

  useEffect(() => {
    setActiveValues(new Set(values.map((v) => nrm(v.value))));
  }, [values]);

  const toggleValue = (value: string) =>
    setActiveValues((prev) => {
      const next = new Set(prev);
      const k = nrm(value);
      next.has(k) ? next.delete(k) : next.add(k);
      return next.size === 0 ? new Set(values.map((v) => nrm(v.value))) : next;
    });

  const onSearch = (v: string) => {
    setSearch(v);
    const q = nrm(v);
    const match = lots.find((l) => nrm(l.id) === q);
    if (match) setSelected(match.id);
  };

  const selectedLot = selected ? lotsByCode.get(selected) ?? null : null;
  const hoverLot = hover ? lotsByCode.get(hover.id) ?? null : null;
  const tasa = stats.total > 0 ? stats.vendidos / stats.total : 0;

  return (
    <div className="min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between border-b border-border px-4 glass sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-brand-fg">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
              <path d="M8 22V11.5C8 10.67 8.67 10 9.5 10h4c.83 0 1.5.67 1.5 1.5V22M17 22v-7.5c0-.83.67-1.5 1.5-1.5h4c.83 0 1.5.67 1.5 1.5V22M6 22.5h20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold tracking-tight text-content">Urbanix</p>
            <p className="text-2xs text-content-3">Urbanización Las Palmas (demo)</p>
          </div>
          <Badge tone="brand" dot className="ml-1 hidden sm:inline-flex">
            <Sparkles className="h-3 w-3" /> Modo demo
          </Badge>
        </div>
        <Link to="/login">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="h-4 w-4" /> Salir del demo
          </Button>
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[1400px] p-4 sm:p-6 lg:p-8">
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-brand/30 bg-brand-soft/60 p-3.5 text-sm text-content-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
          <p>
            Datos de ejemplo, sin base de datos. Pasa el cursor o haz clic en un lote, alterna entre
            <b> Estados</b> y <b>Financiamiento</b> en el panel, filtra y prueba el zoom.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Lotes totales" value={formatNumber(stats.total)} icon={LayoutGrid} accent="brand" />
          <KpiCard label="Disponibles" value={formatNumber(stats.disponibles)} icon={Home} accent="success" />
          <KpiCard label="Vendidos" value={formatNumber(stats.vendidos)} icon={CheckCircle2} accent="info" />
          <KpiCard label="Tasa de venta" value={formatPercent(tasa, 0)} icon={TrendingUp} accent="warning" />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="relative h-[560px]">
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
                <LotTooltip lot={hoverLot} colorFor={colorFor} x={hover.x} y={hover.y} />
              )}
            </div>
          </div>

          <Card className="p-4">
            <LegendPanel
              dimension={dimension}
              onDimensionChange={setDimension}
              values={values}
              colorFor={colorFor}
              activeValues={activeValues}
              onToggleValue={toggleValue}
              search={search}
              onSearch={onSearch}
              selectedLot={selectedLot}
              onClearSelection={() => setSelected(null)}
              editable={!!selectedLot}
              estadoOptions={estadoOptions}
              financiamientoOptions={financiamientoOptions}
              onChangeEstado={selectedLot ? (estado) => updateLot(selectedLot.id, { estado }) : undefined}
              onChangeFinanciamiento={selectedLot ? (financiamiento) => updateLot(selectedLot.id, { financiamiento: financiamiento || null }) : undefined}
            />
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader title="Distribución por estado" description="Proporción de lotes del proyecto demo" />
          <CardBody>
            <StatusDistribution stats={stats} />
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
