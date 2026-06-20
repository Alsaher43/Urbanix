import { Activity } from 'lucide-react';
import type { HistorialEntry } from '@/types';
import { initials, formatRelative, formatDateTime } from '@/lib/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

function Row({ entry }: { entry: HistorialEntry }) {
  return (
    <li className="flex gap-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-2xs font-semibold text-brand">
        {initials(entry.usuario)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-content">
          <span className="font-semibold">{entry.usuario}</span>{' '}
          <span className="text-content-2">{entry.accion}</span>
        </p>
        <p className="mt-0.5 text-2xs text-content-3" title={formatDateTime(entry.created_at)}>
          {formatRelative(entry.created_at)}
        </p>
      </div>
    </li>
  );
}

export function ActivityFeed({
  entries,
  loading,
  emptyHint,
}: {
  entries: HistorialEntry[];
  loading?: boolean;
  emptyHint?: string;
}) {
  if (loading) {
    return (
      <div className="space-y-3 p-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="Sin actividad todavía"
        description={emptyHint || 'Las acciones realizadas en la plataforma aparecerán aquí.'}
        className="border-0 py-10"
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {entries.map((e) => (
        <Row key={e.id} entry={e} />
      ))}
    </ul>
  );
}
