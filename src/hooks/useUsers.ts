import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, getErrorMessage } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/store/toastStore';
import type { Profile, UserRole } from '@/types';
import { ROLE_LABELS } from '@/types';

export function useProfiles() {
  return useQuery({
    queryKey: ['profiles'],
    queryFn: async (): Promise<Profile[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw new Error(getErrorMessage(error));
      return data as Profile[];
    },
  });
}

export function useUpdateProfileName() {
  const qc = useQueryClient();
  const { profile } = useAuth();
  return useMutation({
    mutationFn: async ({ id, nombre }: { id: string; nombre: string }) => {
      const clean = nombre.trim();
      if (clean.length < 2) throw new Error('El nombre debe tener al menos 2 caracteres.');
      const { error } = await supabase.from('profiles').update({ nombre: clean }).eq('id', id);
      if (error) throw new Error(getErrorMessage(error));
      return { id, nombre: clean };
    },
    onSuccess: ({ nombre }) => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
      void logActivity('create_user', `Actualizó el nombre de un usuario a "${nombre}"`, {
        usuario: profile?.nombre || profile?.email || 'Gerente',
      });
      toast.success('Nombre actualizado');
    },
    onError: (e) => toast.error('No se pudo actualizar el nombre', getErrorMessage(e)),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  const { profile, user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, rol }: { id: string; rol: UserRole }) => {
      if (id === user?.id) throw new Error('No puedes cambiar tu propio rol.');
      const { error } = await supabase.from('profiles').update({ rol }).eq('id', id);
      if (error) throw new Error(getErrorMessage(error));
      return { id, rol };
    },
    onSuccess: ({ rol }) => {
      qc.invalidateQueries({ queryKey: ['profiles'] });
      void logActivity('create_user', `Actualizó un rol a ${ROLE_LABELS[rol]}`, {
        usuario: profile?.nombre || profile?.email || 'Gerente',
      });
      toast.success('Rol actualizado', `Ahora es ${ROLE_LABELS[rol]}.`);
    },
    onError: (e) => toast.error('No se pudo actualizar', getErrorMessage(e)),
  });
}
