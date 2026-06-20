import { useState } from 'react';
import { ChevronDown, FolderKanban, Check } from 'lucide-react';
import { useActiveProject } from '@/hooks/useActiveProject';
import { logActivity } from '@/lib/activity';
import { cn } from '@/lib/cn';

/** Selector compacto del proyecto activo (recuerda la elección). */
export function ProjectSwitcher() {
  const { project, projects, setProject } = useActiveProject();
  const [open, setOpen] = useState(false);

  if (projects.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex h-9 items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm font-medium text-content transition-colors hover:bg-surface-2"
      >
        <FolderKanban className="h-4 w-4 text-content-3" />
        <span className="max-w-[160px] truncate">{project?.nombre ?? 'Selecciona proyecto'}</span>
        <ChevronDown className="h-4 w-4 text-content-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-64 animate-scale-in rounded-lg border border-border bg-surface p-1.5 shadow-lg">
          <p className="px-2 py-1.5 text-2xs font-semibold uppercase tracking-wide text-content-3">
            Proyectos
          </p>
          {projects.map((p) => (
            <button
              key={p.id}
              onMouseDown={() => {
                setProject(p.id);
                void logActivity('open_project', `Abrió el proyecto "${p.nombre}"`, { projectId: p.id });
              }}
              className={cn(
                'flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-surface-2',
                project?.id === p.id ? 'text-brand' : 'text-content-2',
              )}
            >
              <span className="truncate">{p.nombre}</span>
              {project?.id === p.id && <Check className="h-4 w-4 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
