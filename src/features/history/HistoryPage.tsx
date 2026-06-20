import { useMemo, useState } from 'react';
import { useActiveProject } from '@/hooks/useActiveProject';
import {
  useHistorial,
  groupByBucket,
  BUCKET_LABELS,
  BUCKET_ORDER,
  type DateBucket,
} from '@/hooks/useActivity';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProjectSwitcher } from '@/components/ProjectSwitcher';
import { Card } from '@/components/ui/Card';
import { ActivityFeed } from './ActivityFeed';
import { cn } from '@/lib/cn';

type RangeKey = DateBucket | 'all';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'all', label: 'Todo' },
  { key: 'hoy', label: 'Hoy' },
  { key: 'ayer', label: 'Ayer' },
  { key: 'semana', label: 'Últimos 7 días' },
  { key: 'mes', label: 'Últimos 30 días' },
];

export function HistoryPage() {
  const { projectId, project, hasProjects } = useActiveProject();
  const { data: historial = [], isLoading } = useHistorial(projectId, 300);
  const [range, setRange] = useState<RangeKey>('all');

  const grouped = useMemo(() => groupByBucket(historial), [historial]);

  const bucketsToShow: DateBucket[] =
    range === 'all' ? BUCKET_ORDER : ([range] as DateBucket[]);

  return (
    <>
      <PageHeader
        title="Historial"
        description={hasProjects ? `Acciones registradas en ${project?.nombre ?? 'la plataforma'}` : 'Acciones registradas'}
        actions={<ProjectSwitcher />}
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
              range === r.key ? 'border-brand bg-brand-soft text-brand' : 'border-border text-content-2 hover:bg-surface-2',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Card className="p-5">
          <ActivityFeed entries={[]} loading />
        </Card>
      ) : (
        <div className="space-y-6">
          {bucketsToShow.map((bucket) => {
            const entries = grouped[bucket];
            if (entries.length === 0) return null;
            return (
              <section key={bucket}>
                <h2 className="mb-2 px-1 text-sm font-semibold text-content-2">
                  {BUCKET_LABELS[bucket]}
                  <span className="ml-2 text-content-3">{entries.length}</span>
                </h2>
                <Card className="px-5 py-1">
                  <ActivityFeed entries={entries} />
                </Card>
              </section>
            );
          })}
          {historial.length === 0 && (
            <Card className="p-5">
              <ActivityFeed entries={[]} emptyHint="Cuando subas archivos o cambies estados, lo verás aquí." />
            </Card>
          )}
        </div>
      )}
    </>
  );
}
