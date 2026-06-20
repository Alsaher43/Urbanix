import { useEffect } from 'react';
import { useProjects } from './useProjects';
import { useUiStore } from '@/store/uiStore';
import type { Project } from '@/types';

/**
 * Resuelve el proyecto "activo": el último abierto (persistido) o, si no hay,
 * el más reciente. Implementa la memoria de la plataforma.
 */
export function useActiveProject() {
  const { data: projects = [], isLoading, error } = useProjects();
  const lastProjectId = useUiStore((s) => s.lastProjectId);
  const rememberProject = useUiStore((s) => s.rememberProject);

  const exists = projects.some((p) => p.id === lastProjectId);
  const activeId = exists ? lastProjectId : projects[0]?.id ?? null;

  // Si el id recordado ya no existe, corrige la memoria.
  useEffect(() => {
    if (!isLoading && lastProjectId && !exists && projects.length > 0) {
      rememberProject(projects[0].id);
    }
  }, [isLoading, lastProjectId, exists, projects, rememberProject]);

  const project: Project | null = projects.find((p) => p.id === activeId) ?? null;

  return {
    projectId: activeId,
    project,
    projects,
    isLoading,
    error,
    setProject: rememberProject,
    hasProjects: projects.length > 0,
  };
}
