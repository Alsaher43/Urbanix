import { Search, X, Tag, Wallet, DollarSign, CircleDot } from 'lucide-react';
import { DIMENSIONS, prettyLabel, nrm, type Dimension } from '@/config/lotStatus';
import type { Lot } from '@/types';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatNumber } from '@/lib/format';
import { cn } from '@/lib/cn';

export interface LegendValue {
  value: string;
  count: number;
}

export function LegendPanel({
  dimension,
  onDimensionChange,
  values,
  colorFor,
  activeValues,
  onToggleValue,
  search,
  onSearch,
  selectedLot,
  onClearSelection,
  editable = false,
  estadoOptions = [],
  financiamientoOptions = [],
  onChangeEstado,
  onChangeFinanciamiento,
}: {
  dimension: Dimension;
  onDimensionChange: (d: Dimension) => void;
  values: LegendValue[];
  colorFor: (value: string) => string;
  activeValues: Set<string>;
  onToggleValue: (value: string) => void;
  search: string;
  onSearch: (v: string) => void;
  selectedLot: Lot | null;
  onClearSelection: () => void;
  /** Si true y hay callbacks, muestra selects para editar el lote (gerente). */
  editable?: boolean;
  estadoOptions?: string[];
  financiamientoOptions?: string[];
  onChangeEstado?: (value: string) => void;
  onChangeFinanciamiento?: (value: string) => void;
}) {
  const allActive = values.every((v) => activeValues.has(nrm(v.value)));

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      <Input
        placeholder="Buscar lote…"
        leftIcon={<Search className="h-4 w-4" />}
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        rightSlot={
          search ? (
            <button onClick={() => onSearch('')} className="p-1 text-content-3 hover:text-content">
              <X className="h-4 w-4" />
            </button>
          ) : undefined
        }
      />

      {/* Detalle del lote seleccionado */}
      {selectedLot && (
        <div className="animate-fade-in-up rounded-lg border border-border bg-surface-2 p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xs uppercase tracking-wide text-content-3">Lote seleccionado</p>
              <p className="text-xl font-bold text-content">{selectedLot.id}</p>
            </div>
            <button onClick={onClearSelection} className="rounded-md p-1 text-content-3 hover:bg-surface-3 hover:text-content">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge style={{ backgroundColor: colorFor(selectedLot.estado), color: '#fff' }} className="border-transparent">
              {prettyLabel(selectedLot.estado)}
            </Badge>
            {selectedLot.financiamiento && (
              <Badge style={{ backgroundColor: colorFor(selectedLot.financiamiento), color: '#fff' }} className="border-transparent">
                {prettyLabel(selectedLot.financiamiento)}
              </Badge>
            )}
          </div>
          <dl className="mt-4 space-y-2.5 text-sm">
            <DetailRow icon={DollarSign} label="Precio" value={selectedLot.precio != null ? formatCurrency(selectedLot.precio) : '—'} />
            {Object.entries(selectedLot.extra)
              .filter(([, v]) => v !== null && v !== '')
              .slice(0, 5)
              .map(([k, v]) => (
                <DetailRow key={k} icon={Tag} label={prettyLabel(k)} value={String(v)} />
              ))}
          </dl>

          {editable && (onChangeEstado || onChangeFinanciamiento) && (
            <div className="mt-4 space-y-2 border-t border-border pt-3">
              <p className="text-2xs font-semibold uppercase tracking-wide text-content-3">Editar lote</p>
              {onChangeEstado && (
                <EditSelect
                  label="Estado"
                  value={selectedLot.estado}
                  options={estadoOptions}
                  onChange={onChangeEstado}
                />
              )}
              {onChangeFinanciamiento && (
                <EditSelect
                  label="Financiamiento"
                  value={selectedLot.financiamiento ?? ''}
                  options={financiamientoOptions}
                  onChange={onChangeFinanciamiento}
                  allowEmpty
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Conmutador de dimensión */}
      <div className="inline-flex rounded-lg border border-border bg-surface-2 p-0.5">
        {DIMENSIONS.map((d) => (
          <button
            key={d.key}
            onClick={() => onDimensionChange(d.key)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
              dimension === d.key ? 'bg-surface text-content shadow-sm' : 'text-content-3 hover:text-content',
            )}
          >
            {d.key === 'estado' ? <CircleDot className="h-3.5 w-3.5" /> : <Wallet className="h-3.5 w-3.5" />}
            {d.label}
          </button>
        ))}
      </div>

      {/* Valores de la dimensión activa */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-2xs font-semibold uppercase tracking-wide text-content-3">Leyenda · Filtros</p>
          {!allActive && (
            <button
              onClick={() => values.forEach((v) => !activeValues.has(nrm(v.value)) && onToggleValue(v.value))}
              className="text-2xs font-medium text-brand hover:underline"
            >
              Ver todos
            </button>
          )}
        </div>
        {values.length === 0 ? (
          <p className="px-1 text-sm text-content-3">Sin valores en esta dimensión.</p>
        ) : (
          <ul className="space-y-1">
            {values.map(({ value, count }) => {
              const active = activeValues.has(nrm(value));
              return (
                <li key={value}>
                  <button
                    onClick={() => onToggleValue(value)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm transition-colors',
                      active ? 'hover:bg-surface-2' : 'opacity-40 hover:opacity-70',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="h-3.5 w-3.5 shrink-0 rounded-sm ring-1 ring-black/10" style={{ backgroundColor: colorFor(value) }} />
                      <span className="truncate text-content-2">{prettyLabel(value)}</span>
                    </span>
                    <span className="font-mono text-2xs text-content-3">{formatNumber(count)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 px-1 text-2xs leading-relaxed text-content-3">
          Toca un valor para filtrarlo en el plano. Cambia entre Estados y Financiamiento arriba.
        </p>
      </div>
    </div>
  );
}

function EditSelect({
  label,
  value,
  options,
  onChange,
  allowEmpty,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  allowEmpty?: boolean;
}) {
  // Asegura que el valor actual esté siempre presente entre las opciones.
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
        {opts.map((o) => (
          <option key={o} value={o}>
            {prettyLabel(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: typeof Tag; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-content-3">
        <Icon className="h-3.5 w-3.5" /> {label}
      </dt>
      <dd className="truncate font-medium text-content">{value}</dd>
    </div>
  );
}
