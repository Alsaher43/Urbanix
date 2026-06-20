import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, getErrorMessage, isSupabaseConfigured } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/store/toastStore';
import { nrm, prettyLabel } from '@/config/lotStatus';

export interface LotOverride {
  estado: string | null;
  financiamiento: string | null;
}

/** Overrides de lote del proyecto, indexados por lote_id normalizado. */
export function useLotOverrides(projectId: string | null) {
  const qc = useQueryClient();

  // Realtime: refresca cuando otro usuario edita un estado.
  useEffect(() => {
    if (!isSupabaseConfigured || !projectId) return;
    const channel = supabase
      .channel(`lot_overrides:${projectId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lot_overrides', filter: `project_id=eq.${projectId}` },
        () => qc.invalidateQueries({ queryKey: ['lot_overrides', projectId] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [projectId, qc]);

  return useQuery({
    queryKey: ['lot_overrides', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<Map<string, LotOverride>> => {
      const { data, error } = await supabase
        .from('lot_overrides')
        .select('lote_id, estado, financiamiento')
        .eq('project_id', projectId!);
      if (error) throw new Error(getErrorMessage(error));
      const map = new Map<string, LotOverride>();
      (data ?? []).forEach((r) => map.set(nrm(r.lote_id), { estado: r.estado, financiamiento: r.financiamiento }));
      return map;
    },
  });
}

interface SetStatusInput {
  projectId: string;
  loteId: string;
  estado?: string;
  financiamiento?: string | null;
  /** Valores previos (para el mensaje de historial). */
  prevEstado?: string;
  prevFinanciamiento?: string | null;
}

export function useSetLotStatus() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async (input: SetStatusInput) => {
      const row = {
        project_id: input.projectId,
        lote_id: input.loteId,
        updated_by: user?.id ?? null,
        ...(input.estado !== undefined ? { estado: input.estado } : {}),
        ...(input.financiamiento !== undefined ? { financiamiento: input.financiamiento } : {}),
      };

      const { error } = await supabase
        .from('lot_overrides')
        .upsert(row, { onConflict: 'project_id,lote_id' });
      if (error) throw new Error(getErrorMessage(error));
      return input;
    },
    onSuccess: (input) => {
      qc.invalidateQueries({ queryKey: ['lot_overrides', input.projectId] });
      const usuario = profile?.nombre || profile?.email || 'Usuario';
      if (input.estado !== undefined && nrm(input.estado) !== nrm(input.prevEstado)) {
        void logActivity(
          'change_status',
          `cambió ${input.loteId} de ${prettyLabel(input.prevEstado || '—')} a ${prettyLabel(input.estado)}`,
          { projectId: input.projectId, usuario, metadata: { loteId: input.loteId } },
        );
      }
      if (input.financiamiento !== undefined && nrm(input.financiamiento || '') !== nrm(input.prevFinanciamiento || '')) {
        void logActivity(
          'change_status',
          `cambió el financiamiento de ${input.loteId} a ${prettyLabel(input.financiamiento || '—')}`,
          { projectId: input.projectId, usuario, metadata: { loteId: input.loteId } },
        );
      }
      toast.success('Lote actualizado', input.loteId);
    },
    onError: (e) => toast.error('No se pudo actualizar el lote', getErrorMessage(e)),
  });
}
