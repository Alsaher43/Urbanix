import { NavLink } from 'react-router-dom';
import { PanelLeftClose, PanelLeft, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUiStore } from '@/store/uiStore';
import { visibleNavItems } from '@/config/navigation';
import { ROLE_LABELS } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-[60px] items-center gap-2.5 px-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-fg">
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
          <path d="M8 22V11.5C8 10.67 8.67 10 9.5 10h4c.83 0 1.5.67 1.5 1.5V22M17 22v-7.5c0-.83.67-1.5 1.5-1.5h4c.83 0 1.5.67 1.5 1.5V22M6 22.5h20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-base font-bold tracking-tight text-content">Urbanix</p>
          <p className="text-2xs text-content-3">Gestión Inmobiliaria</p>
        </div>
      )}
    </div>
  );
}

export function Sidebar({ mobileOpen, onCloseMobile }: { mobileOpen: boolean; onCloseMobile: () => void }) {
  const { role, profile } = useAuth();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const items = visibleNavItems(role);

  return (
    <>
      {/* Overlay móvil */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onCloseMobile} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-surface transition-all duration-200 ease-smooth',
          collapsed ? 'lg:w-[72px]' : 'lg:w-[var(--sidebar-w)]',
          'w-[var(--sidebar-w)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between">
          <Logo collapsed={collapsed} />
          <button
            onClick={onCloseMobile}
            className="mr-3 rounded-md p-1.5 text-content-3 hover:bg-surface-2 lg:hidden"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors',
                  collapsed && 'lg:justify-center lg:px-0',
                  isActive
                    ? 'bg-brand-soft text-brand'
                    : 'text-content-2 hover:bg-surface-2 hover:text-content',
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <div className={cn('flex items-center gap-2.5 rounded-md p-2', collapsed && 'lg:justify-center')}>
            <Avatar name={profile?.nombre} email={profile?.email} src={profile?.avatar_url} />
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-content">
                  {profile?.nombre || profile?.email}
                </p>
                <p className="text-2xs text-content-3">{role ? ROLE_LABELS[role] : ''}</p>
              </div>
            )}
          </div>
          <button
            onClick={toggle}
            className="mt-1 hidden w-full items-center justify-center gap-2 rounded-md py-1.5 text-content-3 transition-colors hover:bg-surface-2 hover:text-content lg:flex"
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
      </aside>
    </>
  );
}
