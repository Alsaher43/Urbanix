import { useState, type FormEvent } from 'react';
import { Sun, Moon, Monitor, RotateCcw, Palette, UserCog, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useUiStore, type ThemePref } from '@/store/uiStore';
import { useLegendStore } from '@/store/legendStore';
import { EDITABLE_LEGEND, defaultColorFor, nrm } from '@/config/lotStatus';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { ROLE_LABELS } from '@/types';
import { toast } from '@/store/toastStore';
import { cn } from '@/lib/cn';

export function SettingsPage() {
  return (
    <>
      <PageHeader title="Configuración" description="Tu cuenta, apariencia y leyenda del plano" />
      <div className="grid gap-6 lg:grid-cols-2">
        <AccountCard />
        <PasswordCard />
        <AppearanceCard />
        <LegendCard />
      </div>
    </>
  );
}

function AccountCard() {
  const { profile, role } = useAuth();
  return (
    <Card>
      <CardHeader title="Cuenta" description="Información de tu perfil" />
      <CardBody className="flex items-center gap-4">
        <Avatar name={profile?.nombre} email={profile?.email} src={profile?.avatar_url} size="lg" />
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold text-content">
            <UserCog className="h-4 w-4 text-content-3" />
            {profile?.nombre || '—'}
          </p>
          <p className="truncate text-sm text-content-2">{profile?.email}</p>
          <div className="mt-2">
            <Badge tone={role === 'gerente' ? 'brand' : 'neutral'} dot>
              {role ? ROLE_LABELS[role] : ''}
            </Badge>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function PasswordCard() {
  const { updatePassword } = useAuth();
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (pwd.length < 8) return setError('Usa al menos 8 caracteres.');
    if (pwd !== confirm) return setError('Las contraseñas no coinciden.');
    setLoading(true);
    try {
      await updatePassword(pwd);
      setPwd(''); setConfirm('');
      toast.success('Contraseña actualizada');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Cambiar contraseña" description="Actualiza tu contraseña de acceso" />
      <CardBody>
        <form onSubmit={submit} className="space-y-3">
          <Input label="Nueva contraseña" type="password" leftIcon={<Lock className="h-4 w-4" />} value={pwd} onChange={(e) => setPwd(e.target.value)} hint="Mínimo 8 caracteres." />
          <Input label="Confirmar" type="password" leftIcon={<Lock className="h-4 w-4" />} value={confirm} onChange={(e) => setConfirm(e.target.value)} error={error} />
          <Button type="submit" loading={loading} disabled={!pwd || !confirm}>Guardar contraseña</Button>
        </form>
      </CardBody>
    </Card>
  );
}

function AppearanceCard() {
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const options: { key: ThemePref; label: string; icon: typeof Sun }[] = [
    { key: 'light', label: 'Claro', icon: Sun },
    { key: 'dark', label: 'Oscuro', icon: Moon },
    { key: 'system', label: 'Sistema', icon: Monitor },
  ];
  return (
    <Card>
      <CardHeader title="Apariencia" description="Tema de la interfaz" />
      <CardBody>
        <div className="grid grid-cols-3 gap-2">
          {options.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors',
                theme === key ? 'border-brand bg-brand-soft text-brand' : 'border-border text-content-2 hover:bg-surface-2',
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function LegendCard() {
  const overrides = useLegendStore((s) => s.overrides);
  const setColor = useLegendStore((s) => s.setColor);
  const reset = useLegendStore((s) => s.reset);

  const groups = [
    { title: 'Estados', items: EDITABLE_LEGEND.filter((l) => l.dimension === 'estado') },
    { title: 'Financiamiento', items: EDITABLE_LEGEND.filter((l) => l.dimension === 'financiamiento') },
  ];

  return (
    <Card>
      <CardHeader
        title="Leyenda del plano"
        description="Colores de estados y financiamiento"
        action={
          Object.keys(overrides).length > 0 ? (
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="h-3.5 w-3.5" /> Restablecer
            </Button>
          ) : (
            <Palette className="h-4 w-4 text-content-3" />
          )
        }
      />
      <CardBody className="space-y-4">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-content-3">{g.title}</p>
            <ul className="space-y-2.5">
              {g.items.map((item) => {
                const current = overrides[nrm(item.sample)] ?? defaultColorFor(item.sample);
                return (
                  <li key={item.label} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2.5 text-sm text-content-2">
                      <span className="h-3.5 w-3.5 rounded-sm ring-1 ring-black/10" style={{ backgroundColor: current }} />
                      {item.label}
                    </span>
                    <label className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-2 px-2 py-1">
                      <span className="font-mono text-2xs uppercase text-content-3">{current}</span>
                      <input
                        type="color"
                        value={current}
                        onChange={(e) => setColor(item.sample, e.target.value)}
                        className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
