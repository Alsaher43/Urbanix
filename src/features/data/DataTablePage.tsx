import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Download, ArrowUpDown, ArrowUp, ArrowDown, Table2, ChevronLeft, ChevronRight, Filter,
  ChevronDown, FileText, FileSpreadsheet,
} from 'lucide-react';
import { useActiveProject } from '@/hooks/useActiveProject';
import { useActiveData } from '@/hooks/useActiveData';
import { useAuth } from '@/context/AuthContext';
import { useColorFor } from '@/store/legendStore';
import { logActivity } from '@/lib/activity';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ManagerOnly } from '@/components/auth/RoleGate';
import { exportLotsToCsv } from '@/utils/exportCsv';
import { exportLotsToPdf } from '@/utils/exportPdf';
import { toast } from '@/store/toastStore';
import { useSetLotStatus } from '@/hooks/useLotOverrides';
import { buildLegendValues } from '@/features/visualizer/legendValues';
import { nrm, prettyLabel, ESTADO_ORDER, uniqueByNorm } from '@/config/lotStatus';
import { formatCurrency, formatNumber } from '@/lib/format';
import type { Lot } from '@/types';
import { cn } from '@/lib/cn';

type SortKey = 'id' | 'estado' | 'financiamiento' | 'precio';
type SortDir = 'asc' | 'desc';
const PAGE_SIZE = 12;

const COLUMNS: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'id', label: 'Lote' },
  { key: 'estado', label: 'Estado' },
  { key: 'financiamiento', label: 'Financiamiento' },
  { key: 'precio', label: 'Precio', align: 'right' },
];

export function DataTablePage() {
  const { profile, isManager } = useAuth();
  const { projectId, project, hasProjects } = useActiveProject();
  const { lots, hasExcel, isLoadingLots } = useActiveData(projectId);
  const colorFor = useColorFor();
  const setStatus = useSetLotStatus();
  const estadoOptions = useMemo(() => uniqueByNorm([...ESTADO_ORDER, ...lots.map((l) => l.estado)]), [lots]);

  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'id', dir: 'asc' });
  const [page, setPage] = useState(0);
  const [exportOpen, setExportOpen] = useState(false);

  const estadoValues = useMemo(() => buildLegendValues(lots, 'estado'), [lots]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = lots;
    if (q) {
      rows = rows.filter(
        (l) =>
          l.id.toLowerCase().includes(q) ||
          l.estado.toLowerCase().includes(q) ||
          (l.financiamiento?.toLowerCase().includes(q) ?? false) ||
          Object.values(l.extra).some((v) => String(v ?? '').toLowerCase().includes(q)),
      );
    }
    if (estadoFilter !== 'all') rows = rows.filter((l) => nrm(l.estado) === estadoFilter);

    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = a[sort.key];
      const vb = b[sort.key];
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb), 'es', { numeric: true }) * dir;
    });
  }, [lots, search, estadoFilter, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const toggleSort = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const nombre = project?.nombre ?? 'Urbanix';

  const onExportCsv = () => {
    setExportOpen(false);
    exportLotsToCsv(filtered, `${nombre}-lotes.csv`);
    void logActivity('export', `Exportó ${filtered.length} lotes a CSV`, {
      projectId: projectId!,
      usuario: profile?.nombre || profile?.email || 'Usuario',
    });
    toast.success('Exportación lista', `${filtered.length} lotes descargados.`);
  };

  const onExportPdf = () => {
    setExportOpen(false);
    const ok = exportLotsToPdf(filtered, nombre, colorFor);
    if (!ok) {
      toast.error('Ventana bloqueada', 'Permite las ventanas emergentes para generar el PDF.');
      return;
    }
    void logActivity('export', `Generó un reporte PDF de ${filtered.length} lotes`, {
      projectId: projectId!,
      usuario: profile?.nombre || profile?.email || 'Usuario',
    });
  };

  if (!hasProjects) {
    return <EmptyState icon={Table2} title="Sin proyectos" description="Crea un proyecto para empezar." className="mt-10" />;
  }

  return (
    <>
      <PageHeader
        title="Lotes"
        description={project?.nombre}
        actions={
          <>
            <ProjectSwitcher />
            <ManagerOnly>
              <div className="relative">
                <Button
                  variant="secondary"
                  onClick={() => setExportOpen((o) => !o)}
                  onBlur={() => setTimeout(() => setExportOpen(false), 150)}
                  disabled={filtered.length === 0}
                >
                  <Download className="h-4 w-4" /> Exportar <ChevronDown className="h-3.5 w-3.5" />
                </Button>
                {exportOpen && (
                  <div className="absolute right-0 top-11 z-50 w-44 animate-scale-in rounded-lg border border-border bg-surface p-1.5 shadow-lg">
                    <button
                      onMouseDown={onExportCsv}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-content-2 transition-colors hover:bg-surface-2 hover:text-content"
                    >
                      <FileSpreadsheet className="h-4 w-4" /> Exportar CSV
                    </button>
                    <button
                      onMouseDown={onExportPdf}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-content-2 transition-colors hover:bg-surface-2 hover:text-content"
                    >
                      <FileText className="h-4 w-4" /> Reporte PDF
                    </button>
                  </div>
                )}
              </div>
            </ManagerOnly>
          </>
        }
      />

      {!hasExcel && !isLoadingLots ? (
        <EmptyState
          icon={Table2}
          title="No hay datos de lotes"
          description="Carga un Excel desde la sección de proyectos para ver la tabla."
          action={<Link to="/proyectos"><Button>Ir a archivos</Button></Link>}
          className="mt-4"
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="sm:w-72">
              <Input
                placeholder="Buscar lote, estado, cliente…"
                leftIcon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <Filter className="h-4 w-4 shrink-0 text-content-3" />
              <FilterChip active={estadoFilter === 'all'} onClick={() => { setEstadoFilter('all'); setPage(0); }}>
                Todos
              </FilterChip>
              {estadoValues.map(({ value }) => (
                <FilterChip
                  key={value}
                  active={estadoFilter === nrm(value)}
                  color={colorFor(value)}
                  onClick={() => { setEstadoFilter(nrm(value)); setPage(0); }}
                >
                  {prettyLabel(value)}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/50">
                  {COLUMNS.map((col) => (
                    <th key={col.key} className={cn('px-4 py-3 text-left font-medium text-content-2', col.align === 'right' && 'text-right')}>
                      <button
                        onClick={() => toggleSort(col.key)}
                        className={cn('inline-flex items-center gap-1.5 hover:text-content', col.align === 'right' && 'flex-row-reverse')}
                      >
                        {col.label}
                        <SortIcon active={sort.key === col.key} dir={sort.dir} />
                      </button>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left font-medium text-content-2">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingLots ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-border">
                      {Array.from({ length: 5 }).map((__, j) => (
                        <td key={j} className="px-4 py-3"><div className="skeleton h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-content-3">
                      No se encontraron lotes con esos criterios.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((lot) => (
                    <Row
                      key={lot.id}
                      lot={lot}
                      colorFor={colorFor}
                      editable={isManager}
                      estadoOptions={estadoOptions}
                      onChangeEstado={
                        isManager && projectId
                          ? (estado) => setStatus.mutate({ projectId, loteId: lot.id, estado, prevEstado: lot.estado })
                          : undefined
                      }
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm">
            <p className="text-content-3">{formatNumber(filtered.length)} lote{filtered.length === 1 ? '' : 's'}</p>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" disabled={safePage === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 text-content-2">{safePage + 1} / {pageCount}</span>
              <Button variant="ghost" size="icon" disabled={safePage >= pageCount - 1} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({
  lot, colorFor, editable, estadoOptions = [], onChangeEstado,
}: {
  lot: Lot;
  colorFor: (v: string) => string;
  editable?: boolean;
  estadoOptions?: string[];
  onChangeEstado?: (estado: string) => void;
}) {
  const extraPreview = Object.entries(lot.extra).filter(([, v]) => v !== null && v !== '').slice(0, 2);
  const opts = lot.estado && !estadoOptions.some((o) => nrm(o) === nrm(lot.estado)) ? [lot.estado, ...estadoOptions] : estadoOptions;
  return (
    <tr className="border-b border-border transition-colors last:border-0 hover:bg-surface-2/50">
      <td className="px-4 py-3 font-semibold text-content">{lot.id}</td>
      <td className="px-4 py-3">
        {editable && onChangeEstado ? (
          <select
            value={lot.estado}
            onChange={(e) => onChangeEstado(e.target.value)}
            className="rounded-full border-transparent px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-brand/40"
            style={{ backgroundColor: colorFor(lot.estado) }}
          >
            {opts.map((o) => (
              <option key={o} value={o} className="bg-surface text-content">
                {prettyLabel(o)}
              </option>
            ))}
          </select>
        ) : (
          <Badge style={{ backgroundColor: colorFor(lot.estado), color: '#fff' }} className="border-transparent">
            {prettyLabel(lot.estado)}
          </Badge>
        )}
      </td>
      <td className="px-4 py-3 text-content-2">{lot.financiamiento ? prettyLabel(lot.financiamiento) : '—'}</td>
      <td className="px-4 py-3 text-right text-content-2">{lot.precio != null ? formatCurrency(lot.precio) : '—'}</td>
      <td className="px-4 py-3 text-content-3">
        {extraPreview.length ? extraPreview.map(([k, v]) => `${k}: ${v}`).join(' · ') : '—'}
      </td>
    </tr>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 text-content-3" />;
  return dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-brand" /> : <ArrowDown className="h-3.5 w-3.5 text-brand" />;
}

function FilterChip({ active, color, onClick, children }: { active: boolean; color?: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active ? 'border-brand bg-brand-soft text-brand' : 'border-border text-content-2 hover:bg-surface-2',
      )}
    >
      {color && <span className="h-2.5 w-2.5 rounded-sm ring-1 ring-black/10" style={{ backgroundColor: color }} />}
      {children}
    </button>
  );
}
