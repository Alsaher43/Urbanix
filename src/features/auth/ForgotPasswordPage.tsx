import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { AuthShell } from './AuthShell';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email)) {
      setError('Introduce un correo válido.');
      return;
    }
    setSubmitting(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el correo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell>
      {sent ? (
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-content">Revisa tu correo</h1>
          <p className="mt-2 text-sm text-content-2">
            Si existe una cuenta con <span className="font-medium text-content">{email}</span>, te
            enviamos un enlace para restablecer tu contraseña.
          </p>
          <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline">
            <ArrowLeft className="h-4 w-4" /> Volver a iniciar sesión
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-content">Recuperar contraseña</h1>
            <p className="mt-1.5 text-sm text-content-2">
              Te enviaremos un enlace para crear una nueva contraseña.
            </p>
          </div>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@empresa.com"
              leftIcon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={error}
              autoFocus
            />
            <Button type="submit" size="lg" loading={submitting} className="w-full">
              Enviar enlace
            </Button>
          </form>
          <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-content-2 hover:text-content">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </>
      )}
    </AuthShell>
  );
}
