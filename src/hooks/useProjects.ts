import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, getErrorMessage } from '@/lib/supabase';
import { logActivity } from '@/lib/activity';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/store/toastStore';
import type { Project } from '@/types';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async (): Promise<Project[]> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw new Error(getErrorMessage(error));
      return data as Project[];
    },
  });
}

export function useProject(projectId: string | null) {
  return useQuery({
    queryKey: ['project', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<Project | null> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId!)
        .maybeSingle();
      if (error) throw new Error(getErrorMessage(error));
      return data as Project | null;
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const { user, profile } = useAuth();
  return useMutation({
    mutationFn: async (input: { nombre: string; descripcion?: string; ubicacion?: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({ ...input, owner_id: user?.id ?? null })
        .select()
        .single();
      if (error) throw new Error(getErrorMessage(error));
      return data as Project;
    },
    onSuccess: (project) => {
      qc.invalidateQueries({ queryKey: ['projects'] });
      void logActivity('open_project', `Creó el proyecto "${project.nombre}"`, {
        projectId: project.id,
        usuario: profile?.nombre || profile?.email || 'Usuario',
      });
      toast.success('Proyecto creado', `"${project.nombre}" está listo.`);
    },
    onError: (e) => toast.error('No se pudo crear el proyecto', getErrorMessage(e)),
  });
}
