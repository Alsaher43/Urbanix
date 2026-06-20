import { useQuery } from '@tanstack/react-query';
import { supabase, getErrorMessage } from '@/lib/supabase';
import type { HistorialEntry } from '@/types';

export type DateBucket = 'hoy' | 'ayer' | 'semana' | 'mes' | 'anterior';

export const BUCKET_LABELS: Record<DateBucket, string> = {
  hoy: 'Hoy',
  ayer: 'Ayer',
  semana: 'Últimos 7 días',
  mes: 'Últimos 30 días',
  anterior: 'Anterior',
};

export const BUCKET_ORDER: DateBucket[] = ['hoy', 'ayer', 'semana', 'mes', 'anterior'];

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function bucketFor(date: string | Date): DateBucket {
  const t = new Date(date).getTime();
  const today = startOfDay(new Date());
  const dayMs = 86_400_000;
  if (t >= today) return 'hoy';
  if (t >= today - dayMs) return 'ayer';
  if (t >= today - 7 * dayMs) return 'semana';
  if (t >= today - 30 * dayMs) return 'mes';
  return 'anterior';
}

export function useHistorial(projectId: string | null, limit = 200) {
  return useQuery({
    queryKey: ['historial', projectId, limit],
    queryFn: async (): Promise<HistorialEntry[]> => {
      let q = supabase
        .from('historial')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (projectId) q = q.eq('project_id', projectId);
      const { data, error } = await q;
      if (error) throw new Error(getErrorMessage(error));
      return data as HistorialEntry[];
    },
  });
}

/** Agrupa el historial en buckets temporales para la UI. */
export function groupByBucket(entries: HistorialEntry[]): Record<DateBucket, HistorialEntry[]> {
  const groups = { hoy: [], ayer: [], semana: [], mes: [], anterior: [] } as Record<
    DateBucket,
    HistorialEntry[]
  >;
  for (const e of entries) groups[bucketFor(e.created_at)].push(e);
  return groups;
}
