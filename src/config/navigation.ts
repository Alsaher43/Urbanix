import {
  LayoutDashboard,
  Map,
  Table2,
  History,
  Users,
  Settings,
  FolderKanban,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Si se define, solo estos roles ven el ítem. */
  allow?: UserRole[];
  end?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/proyectos', label: 'Proyectos', icon: FolderKanban },
  { to: '/plano', label: 'Plano', icon: Map },
  { to: '/lotes', label: 'Lotes', icon: Table2 },
  { to: '/historial', label: 'Historial', icon: History },
  { to: '/usuarios', label: 'Usuarios', icon: Users, allow: ['gerente'] },
  { to: '/configuracion', label: 'Configuración', icon: Settings, allow: ['gerente'] },
];

export function visibleNavItems(role: UserRole | null): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.allow || (role && item.allow.includes(role)));
}
