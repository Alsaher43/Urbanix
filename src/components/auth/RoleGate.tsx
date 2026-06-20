import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/types';

/**
 * Oculta su contenido salvo que el rol del usuario esté permitido.
 * Úsalo para esconder botones de gerente (subir, editar, exportar…).
 */
export function RoleGate({ allow, children }: { allow: UserRole[]; children: ReactNode }) {
  const { role } = useAuth();
  if (!role || !allow.includes(role)) return null;
  return <>{children}</>;
}

/** Atajo: solo gerentes. */
export function ManagerOnly({ children }: { children: ReactNode }) {
  return <RoleGate allow={['gerente']}>{children}</RoleGate>;
}
