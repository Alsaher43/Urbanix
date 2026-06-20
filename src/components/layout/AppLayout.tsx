import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUiStore } from '@/store/uiStore';
import { NAV_ITEMS } from '@/config/navigation';
import { cn } from '@/lib/cn';

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  ...Object.fromEntries(NAV_ITEMS.map((i) => [i.to, i.label])),
  '/reset-password': 'Cambiar contraseña',
};

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const { pathname } = useLocation();

  const title =
    TITLES[pathname] ||
    NAV_ITEMS.find((i) => i.to !== '/' && pathname.startsWith(i.to))?.label ||
    'Urbanix';

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-200 ease-smooth',
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-[var(--sidebar-w)]',
        )}
      >
        <Topbar onOpenMenu={() => setMobileOpen(true)} title={title} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1400px] animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
