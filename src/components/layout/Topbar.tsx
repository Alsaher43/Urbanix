import { useState } from 'react';
import { Menu, Sun, Moon, Monitor, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useUiStore, type ThemePref } from '@/store/uiStore';
import { useProject } from '@/hooks/useProjects';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ROLE_LABELS } from '@/types';
import { cn } from '@/lib/cn';

const THEME_CYCLE: ThemePref[] = ['light', 'dark', 'system'];
const THEME_ICON = { light: Sun, dark: Moon, system: Monitor };

function ThemeToggle() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const Icon = THEME_ICON[theme];
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length];
  return (
    <button
      onClick={() => setTheme(next)}
      className="flex h-9 w-9 items-center justify-center rounded-md text-content-2 transition-colors hover:bg-surface-2 hover:text-content"
      title={`Tema: ${theme} (clic para cambiar)`}
      aria-label="Cambiar tema"
    >
      <Icon className="h-[18px] w-[18px]" />
    </button>
  );
}

function UserMenu() {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="flex items-center gap-2 rounded-md p-1 pr-2 transition-colors hover:bg-surface-2"
      >
        <Avatar name={profile?.nombre} email={profile?.email} src={profile?.avatar_url} size="sm" />
        <ChevronDown className="h-4 w-4 text-content-3" />
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-60 animate-scale-in rounded-lg border border-border bg-surface p-1.5 shadow-lg">
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-medium text-content">{profile?.nombre || profile?.email}</p>
            <div className="mt-1.5">
              <Badge tone={role === 'gerente' ? 'brand' : 'neutral'} dot>
                {role ? ROLE_LABELS[role] : ''}
              </Badge>
            </div>
          </div>
          <button
            onMouseDown={() => navigate('/configuracion')}
            className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-content-2 transition-colors hover:bg-surface-2 hover:text-content"
          >
            Mi cuenta
          </button>
          <button
            onMouseDown={() => void signOut()}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export function Topbar({ onOpenMenu, title }: { onOpenMenu: () => void; title?: string }) {
  const lastProjectId = useUiStore((s) => s.lastProjectId);
  const { data: project } = useProject(lastProjectId);

  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-[60px] items-center justify-between gap-3 border-b border-border px-4 glass',
      )}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMenu}
          className="flex h-9 w-9 items-center justify-center rounded-md text-content-2 hover:bg-surface-2 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-content">{title || 'Urbanix'}</h1>
          {project && <p className="truncate text-2xs text-content-3">Proyecto: {project.nombre}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}
