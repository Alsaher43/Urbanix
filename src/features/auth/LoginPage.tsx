import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AuthShell } from './AuthShell';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FullScreenLoader } from '@/components/ui/Spinner';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginPage() {
  const { session, loading, isConfigured, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  if (!isConfigured) return <Navigate to="/setup" replace />;
  if (loading) return <FullScreenLoader />;
  if (session) {
    const from = (location.state as { from?: Location })?.from?.pathname || '/';
    return <Navigate to={from} replace />;
  }

  const validate = () => {
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email)) next.email = 'Introduce un correo válido.';
    if (password.length < 6) next.password = 'La contraseña debe tener al menos 6 caracteres.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validate()) return;
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setErrors({ form: err instanceof Error ? err.message : 'No se pudo iniciar sesión.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-content">Bienvenido de nuevo</h1>
        <p className="mt-1.5 text-sm text-content-2">Inicia sesión para administrar tus proyectos.</p>
      </div>

      {errors.form && (
        <div className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger">
          {errors.form}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="tu@empresa.com"
          leftIcon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoFocus
        />
        <Input
          label="Contraseña"
          type={showPass ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••"
          leftIcon={<Lock className="h-4 w-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              className="rounded p-1.5 text-content-3 hover:text-content"
              aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-content-3">Tu sesión se mantiene en este dispositivo.</span>
          <Link to="/forgot-password" className="text-sm font-medium text-brand hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" size="lg" loading={submitting} className="w-full">
          Iniciar sesión
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-content-3">
        El acceso es gestionado por tu administrador. ¿Problemas para entrar? Contáctalo.
      </p>
      <p className="mt-3 text-center text-sm">
        <Link to="/demo" className="font-medium text-brand hover:underline">
          Ver demo con datos de ejemplo →
        </Link>
      </p>
    </AuthShell>
  );
}
