import { useQuery } from '@tanstack/react-query';
import { supabase, getErrorMessage } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Organization } from '@/types';

/**
 * Carga la organización (inmobiliaria) del usuario actual. Se activa solo si hay
 * org_id, así que antes de aplicar la migración 0003 no consulta nada (no rompe).
 */
export function useOrganization() {
  const { orgId } = useAuth();
  return useQuery({
    queryKey: ['organization', orgId],
    enabled: !!orgId,
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<Organization | null> => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId!)
        .maybeSingle();
      if (error) throw new Error(getErrorMessage(error));
      return data as Organization | null;
    },
  });
}
