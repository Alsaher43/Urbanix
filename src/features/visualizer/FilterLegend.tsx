import { useMemo, useRef, useState } from 'react';
import {
  Search, X, ChevronRight, ChevronDown, Minus, Maximize2, Tag, DollarSign, MapPin, Wallet,
  CircleDot, Filter, Eraser, GripVertical,
} from 'lucide-react';
import type { Lot } from '@/types';
import { nrm, prettyLabel } from '@/config/lotStatus';
import { lotField } from '@/utils/lotFields';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';

/* ───────── Estructura declarativa de la leyenda (campos REALES del Excel) ───────── */
export type FacetKey = 'estado' | 'ubicacion' | 'financiamiento' | 'cuotas';

const UBICACIONES = ['Esquina', 'Calle', 'Avenida', 'Pasaje'];
const CUOTAS = ['-12 meses', '12 meses', '24 meses', '36 meses', '+36 meses'];
const ESTADOS = [
  { value: 'Disponible', color: '#10B981' },
  { value: 'Vendido', color: '#EF4444' },
];
const FIN_DIRECTO = 'Financiamiento directo';
const CONTADO = 'Contado';

export interface Facets {
  estado: Set<string>;
  ubicacion: Set<string>;
  financiamiento: Set<string>;
  cuotas: Set<string>;
}

export function FilterLegend({
  lots,
  colorFor,
  facets,
  onToggle,
  onClear,
  search,
  onSearch,
  selectedLot,
  onClearSelection,
  editable = false,
  estadoOptions = [],
  financiamientoOptions = [],
  onChangeEstado,
  onChangeFinanciamiento,
  anchor = 'left',
}: {
  lots: Lot[];
  colorFor: (value: string) => string;
  facets: Facets;
  onToggle: (facet: FacetKey, value: string) => void;
  onClear: () => void;
  search: string;
  onSearch: (v: string) => void;
  selectedLot: Lot | null;
  onClearSelection: () => void;
  editable?: boolean;
  estadoOptions?: string[];
  financiamientoOptions?: string[];
  onChangeEstado?: (value: string) => void;
  onChangeFinanciamiento?: (value: string) => void;
  /** Lado donde se ancla por defecto (se puede arrastrar libremente). */
  anchor?: 'left' | 'right';
}) {
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Arrastre: la leyenda flota y se puede mover desde su cabecera.
  const rootRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ dx: 0, dy: 0 });
  const drag = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  const onDragStart = (e: React.PointerEvent) => {
    if ((e.target as Element).closest('button, input, select')) return;
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, ox: pos.dx, oy: pos.dy };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    let dx = drag.current.ox + (e.clientX - drag.current.sx);
    let dy = drag.current.oy + (e.clientY - drag.current.sy);
    const el = rootRef.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (el && parent) {
      const minDx = -el.offsetLeft;
      const maxDx = parent.clientWidth - el.offsetWidth - el.offsetLeft;
      const minDy = -el.offsetTop;
      const maxDy = parent.clientHeight - el.offsetHeight - el.offsetTop;
      dx = Math.max(minDx, Math.min(maxDx, dx));
      dy = Math.max(minDy, Math.min(maxDy, dy));
    }
    setPos({ dx, dy });
  };
  const onDragEnd = () => { drag.current.active = false; };

  // Conteos contextuales (estado, estado+ubicacion, financiamiento, cuotas en directo).
  const counts = useMemo(() => {
    const estado: Record<string, number> = {};
    const ubic: Record<string, number> = {};
    const fin: Record<string, number> = {};
    const cuota: Record<string, number> = {};
    for (const l of lots) {
      const e = nrm(l.estado);
      const u = nrm(lotField(l, 'ubicacion'));
      const f = nrm(l.financiamiento || '');
      const c = nrm(lotField(l, 'Cuotas'));
      if (e) estado[e] = (estado[e] ?? 0) + 1;
      if (e && u) ubic[`${e}|${u}`] = (ubic[`${e}|${u}`] ?? 0) + 1;
      if (f) fin[f] = (fin[f] ?? 0) + 1;
      if (f === nrm(FIN_DIRECTO) && c) cuota[c] = (cuota[c] ?? 0) + 1;
    }
    return { estado, ubic, fin, cuota };
  }, [lots]);

  const totalActive = facets.estado.size + facets.ubicacion.size + facets.financiamiento.size + facets.cuotas.size;

  const toggleExpand = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // Al seleccionar una categoría principal, se despliegan sus subcategorías.
  const toggleParent = (facet: FacetKey, value: string, expandKey: string) => {
    onToggle(facet, value);
    if (!facets[facet].has(nrm(value))) setExpanded((p) => new Set(p).add(expandKey));
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        'glass absolute top-3 z-10 flex max-h-[calc(100%-1.5rem)] w-80 max-w-[calc(100%-1.5rem)] flex-col overflow-hidden rounded-xl border border-border shadow-xl',
        anchor === 'right' ? 'right-3' : 'left-3',
      )}
      style={{ transform: `translate(${pos.dx}px, ${pos.dy}px)` }}
    >
      {/* Header (asa de arrastre) */}
      <div
        className="flex cursor-move touch-none select-none items-center justify-between gap-2 border-b border-border px-3 py-2.5"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerCancel={onDragEnd}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-content">
          <GripVertical className="h-4 w-4 text-content-3" /> Leyenda y filtros
          {totalActive > 0 && <Badge tone="brand">{totalActive}</Badge>}
        </span>
        <div className="flex items-center gap-0.5">
          {totalActive > 0 && (
            <button onClick={onClear} title="Limpiar filtros" className="rounded-md p-1.5 text-content-3 hover:bg-surface-2 hover:text-content">
              <Eraser className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setMinimized((m) => !m)}
            title={minimized ? 'Expandir' : 'Minimizar'}
            className="rounded-md p-1.5 text-content-3 hover:bg-surface-2 hover:text-content"
          >
            {minimized ? <Maximize2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!minimized && (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
          <Input
            placeholder="Buscar lote (ej. H1-1)…"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            rightSlot={search ? (
              <button onClick={() => onSearch('')} className="p-1 text-content-3 hover:text-content"><X className="h-4 w-4" /></button>
            ) : undefined}
          />

          {selectedLot && (
            <LotDetail
              lot={selectedLot}
              colorFor={colorFor}
              onClear={onClearSelection}
              editable={editable}
              estadoOptions={estadoOptions}
              financiamientoOptions={financiamientoOptions}
              onChangeEstado={onChangeEstado}
              onChangeFinanciamiento={onChangeFinanciamiento}
            />
          )}

          {/* ───── Estado (con subcategorías de ubicación) ───── */}
          <Section icon={CircleDot} title="Estado">
            {ESTADOS.map((est) => {
              const key = `estado:${est.value}`;
              const open = expanded.has(key);
              const active = facets.estado.has(nrm(est.value));
              return (
                <div key={est.value}>
                  <ParentRow
                    color={colorFor(est.value)}
                    label={est.value}
                    count={counts.estado[nrm(est.value)] ?? 0}
                    active={active}
                    open={open}
                    onToggleFilter={() => toggleParent('estado', est.value, key)}
                    onToggleExpand={() => toggleExpand(key)}
                  />
                  {open && (
                    <div className="ml-4 border-l border-border pl-2">
                      {UBICACIONES.map((u) => (
                        <SubRow
                          key={u}
                          label={u}
                          icon={MapPin}
                          count={counts.ubic[`${nrm(est.value)}|${nrm(u)}`] ?? 0}
                          active={facets.ubicacion.has(nrm(u))}
                          onToggle={() => onToggle('ubicacion', u)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </Section>

          {/* ───── Financiamiento (Contado · Financiamiento directo → Cuotas) ───── */}
          <Section icon={Wallet} title="Financiamiento">
            <ParentRow
              color={colorFor(CONTADO)}
              label={CONTADO}
              count={counts.fin[nrm(CONTADO)] ?? 0}
              active={facets.financiamiento.has(nrm(CONTADO))}
              onToggleFilter={() => onToggle('financiamiento', CONTADO)}
            />
            {(() => {
              const key = 'fin:directo';
              const open = expanded.has(key);
              return (
                <div>
                  <ParentRow
                    color={colorFor(FIN_DIRECTO)}
                    label={FIN_DIRECTO}
                    count={counts.fin[nrm(FIN_DIRECTO)] ?? 0}
                    active={facets.financiamiento.has(nrm(FIN_DIRECTO))}
                    open={open}
                    onToggleFilter={() => toggleParent('financiamiento', FIN_DIRECTO, key)}
                    onToggleExpand={() => toggleExpand(key)}
                  />
                  {open && (
                    <div className="ml-4 border-l border-border pl-2">
                      {CUOTAS.map((c) => (
                        <SubRow
                          key={c}
                          label={c}
                          icon={Tag}
                          count={counts.cuota[nrm(c)] ?? 0}
                          active={facets.cuotas.has(nrm(c))}
                          onToggle={() => onToggle('cuotas', c)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </Section>

          <p className="px-1 text-2xs leading-relaxed text-content-3">
            Combina filtros: dentro de un grupo suman (O), entre grupos se cruzan (Y). En tiempo real.
          </p>
        </div>
      )}
    </div>
  );
}

/* ───────── Subcomponentes ───────── */
function Section({ icon: Icon, title, children }: { icon: typeof Filter; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 flex items-center gap-1.5 px-1 text-2xs font-semibold uppercase tracking-wide text-content-3">
        <Icon className="h-3.5 w-3.5" /> {title}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function ParentRow({
  color, label, count, active, open, onToggleFilter, onToggleExpand,
}: {
  color: string;
  label: string;
  count: number;
  active: boolean;
  open?: boolean;
  onToggleFilter: () => void;
  onToggleExpand?: () => void;
}) {
  return (
    <div className={cn('flex items-center rounded-md', active && 'bg-brand-soft')}>
      <button onClick={onToggleFilter} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-sm">
        <span className="h-3.5 w-3.5 shrink-0 rounded-sm ring-1 ring-black/10" style={{ backgroundColor: color }} />
        <span className={cn('truncate', active ? 'font-medium text-brand' : 'text-content-2')}>{label}</span>
        <span className="ml-auto font-mono text-2xs text-content-3">{formatNumber(count)}</span>
      </button>
      {onToggleExpand && (
        <button onClick={onToggleExpand} className="shrink-0 px-1.5 py-1.5 text-content-3 hover:text-content" aria-label="Desplegar">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      )}
    </div>
  );
}

function SubRow({
  label, icon: Icon, count, active, onToggle,
}: {
  label: string;
  icon: typeof MapPin;
  count: number;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
        active ? 'bg-brand-soft text-brand' : 'text-content-2 hover:bg-surface-2',
      )}
    >
      <Icon className={cn('h-3.5 w-3.5 shrink-0', active ? 'text-brand' : 'text-content-3')} />
      <span className="truncate">{label}</span>
      <span className="ml-auto font-mono text-2xs text-content-3">{formatNumber(count)}</span>
    </button>
  );
}

function LotDetail({
  lot, colorFor, onClear, editable, estadoOptions, financiamientoOptions, onChangeEstado, onChangeFinanciamiento,
}: {
  lot: Lot;
  colorFor: (v: string) => string;
  onClear: () => void;
  editable: boolean;
  estadoOptions: string[];
  financiamientoOptions: string[];
  onChangeEstado?: (v: string) => void;
  onChangeFinanciamiento?: (v: string) => void;
}) {
  const ubic = lotField(lot, 'ubicacion');
  const cuotas = lotField(lot, 'Cuotas');
  return (
    <div className="animate-fade-in-up rounded-lg border border-border bg-surface-2 p-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-2xs uppercase tracking-wide text-content-3">Lote</p>
          <p className="text-lg font-bold text-content">{lot.id}</p>
        </div>
        <button onClick={onClear} className="rounded-md p-1 text-content-3 hover:bg-surface-3 hover:text-content"><X className="h-4 w-4" /></button>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        <Badge style={{ backgroundColor: colorFor(lot.estado), color: '#fff' }} className="border-transparent">{prettyLabel(lot.estado)}</Badge>
        {ubic && <Badge tone="neutral">{prettyLabel(ubic)}</Badge>}
      </div>
      <dl className="mt-3 space-y-1.5 text-sm">
        {lot.financiamiento && <Row icon={Wallet} label="Financiamiento" value={prettyLabel(lot.financiamiento)} />}
        {cuotas && <Row icon={Tag} label="Cuotas" value={cuotas} />}
        {lot.precio != null && <Row icon={DollarSign} label="Precio" value={formatCurrency(lot.precio)} />}
      </dl>

      {editable && (onChangeEstado || onChangeFinanciamiento) && (
        <div className="mt-3 space-y-2 border-t border-border pt-2.5">
          <p className="text-2xs font-semibold uppercase tracking-wide text-content-3">Editar (gerente)</p>
          {onChangeEstado && <EditSelect label="Estado" value={lot.estado} options={estadoOptions} onChange={onChangeEstado} />}
          {onChangeFinanciamiento && <EditSelect label="Financiamiento" value={lot.financiamiento ?? ''} options={financiamientoOptions} onChange={onChangeFinanciamiento} allowEmpty />}
        </div>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Tag; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-1.5 text-content-3"><Icon className="h-3.5 w-3.5" /> {label}</dt>
      <dd className="truncate font-medium text-content">{value}</dd>
    </div>
  );
}

function EditSelect({
  label, value, options, onChange, allowEmpty,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  allowEmpty?: boolean;
}) {
  const opts = value && !options.some((o) => nrm(o) === nrm(value)) ? [value, ...options] : options;
  return (
    <label className="block">
      <span className="mb-1 block text-2xs text-content-3">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-border bg-surface-2 px-2 text-sm text-content focus:border-brand focus:bg-surface focus:outline-none"
      >
        {allowEmpty && <option value="">— Sin financiamiento —</option>}
        {opts.map((o) => <option key={o} value={o}>{prettyLabel(o)}</option>)}
      </select>
    </label>
  );
}
