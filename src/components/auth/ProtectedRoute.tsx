import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FullScreenLoader } from '@/components/ui/Spinner';
import type { UserRole } from '@/types';

/**
 * Protege rutas: exige sesión válida. Opcionalmente restringe por rol.
 * Nunca permite acceso con usuario inexistente (sin perfil en BD).
 */
export function ProtectedRoute({ allow }: { allow?: UserRole[] }) {
  const { session, profile, loading, isConfigured } = useAuth();
  const location = useLocation();

  if (!isConfigured) return <Navigate to="/setup" replace />;
  if (loading) return <FullScreenLoader label="Verificando sesión…" />;
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;

  // Sesión válida pero sin perfil = usuario no aprovisionado → no permitido.
  if (!profile) return <Navigate to="/login" replace state={{ reason: 'no-profile' }} />;

  if (allow && !allow.includes(profile.rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
