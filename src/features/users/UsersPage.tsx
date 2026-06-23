import { useMemo, useState } from 'react';
import { Users, Search, Info, ShieldCheck, HardHat, Pencil, Check, X } from 'lucide-react';
import { useProfiles, useUpdateRole, useUpdateProfileName } from '@/hooks/useUsers';
import { useAuth } from '@/context/AuthContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ROLE_LABELS, type UserRole } from '@/types';
import { formatRelative } from '@/lib/format';
import { cn } from '@/lib/cn';

export function UsersPage() {
  const { user } = useAuth();
  const { data: profiles = [], isLoading } = useProfiles();
  const updateRole = useUpdateRole();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) => (p.nombre?.toLowerCase().includes(q) ?? false) || p.email.toLowerCase().includes(q),
    );
  }, [profiles, search]);

  return (
    <>
      <PageHeader title="Usuarios" description="Gestiona los accesos y roles de tu equipo" />

      <div className="mb-4 flex items-start gap-3 rounded-lg border border-info/30 bg-info/10 p-3.5 text-sm text-content-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
        <p>
          Por seguridad, las credenciales de acceso se crean desde Supabase (Authentication →
          Users) o mediante una Edge Function con rol de servicio. Al primer inicio de sesión se
          genera automáticamente el perfil; aquí puedes ajustar su rol.
        </p>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-border p-4 sm:w-80">
          <Input
            placeholder="Buscar por nombre o correo…"
            leftIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} title="Sin usuarios" description="No hay usuarios que coincidan." className="border-0 py-10" />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((p) => (
              <li key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={p.nombre} email={p.email} src={p.avatar_url} />
                  <div className="min-w-0">
                    <NameEditor id={p.id} nombre={p.nombre} email={p.email} isSelf={p.id === user?.id} />
                    <p className="truncate text-sm text-content-3">{p.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:shrink-0">
                  <span className="text-2xs text-content-3">Desde {formatRelative(p.created_at)}</span>
                  <RoleToggle
                    value={p.rol}
                    disabled={p.id === user?.id || updateRole.isPending}
                    onChange={(rol) => updateRole.mutate({ id: p.id, rol })}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}

/** Nombre con edición en línea (el gerente puede renombrar a sus usuarios). */
function NameEditor({ id, nombre, email, isSelf }: { id: string; nombre: string | null; email: string; isSelf: boolean }) {
  const update = useUpdateProfileName();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(nombre ?? '');
  const display = nombre || email.split('@')[0];

  const save = () => update.mutate({ id, nombre: val }, { onSuccess: () => setEditing(false) });

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          value={val}
          autoFocus
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setEditing(false);
          }}
          className="h-7 w-40 rounded-md border border-brand bg-surface-2 px-2 text-sm text-content focus:outline-none"
        />
        <button onClick={save} disabled={update.isPending} className="rounded p-1 text-success hover:bg-surface-2" aria-label="Guardar">
          <Check className="h-4 w-4" />
        </button>
        <button onClick={() => setEditing(false)} className="rounded p-1 text-content-3 hover:bg-surface-2" aria-label="Cancelar">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <p className="flex items-center gap-2 font-medium text-content">
      <span className="truncate">{display}</span>
      {isSelf && <Badge tone="neutral">Tú</Badge>}
      <button
        onClick={() => { setVal(nombre ?? ''); setEditing(true); }}
        className="shrink-0 rounded p-0.5 text-content-3 transition-colors hover:text-content"
        title="Editar nombre"
        aria-label="Editar nombre"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </p>
  );
}

function RoleToggle({
  value, disabled, onChange,
}: {
  value: UserRole;
  disabled?: boolean;
  onChange: (rol: UserRole) => void;
}) {
  const roles: { key: UserRole; icon: typeof ShieldCheck }[] = [
    { key: 'gerente', icon: ShieldCheck },
    { key: 'trabajador', icon: HardHat },
  ];
  return (
    <div className={cn('inline-flex rounded-lg border border-border bg-surface-2 p-0.5', disabled && 'opacity-60')}>
      {roles.map(({ key, icon: Icon }) => (
        <button
          key={key}
          disabled={disabled}
          onClick={() => value !== key && onChange(key)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
            value === key ? 'bg-surface text-content shadow-sm' : 'text-content-3 hover:text-content',
            !disabled && 'cursor-pointer',
          )}
        >
          <Icon className="h-3.5 w-3.5" /> {ROLE_LABELS[key]}
        </button>
      ))}
    </div>
  );
}
