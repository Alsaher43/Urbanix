import { Navigate, Link } from 'react-router-dom';
import { Database, Terminal, KeyRound, Sparkles } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { AuthShell } from './AuthShell';
import { Button } from '@/components/ui/Button';

/**
 * Pantalla guiada cuando faltan las variables de entorno de Supabase.
 * Evita la pantalla en blanco y explica al usuario cómo configurar.
 */
export function SetupPage() {
  if (isSupabaseConfigured) return <Navigate to="/login" replace />;

  const steps = [
    {
      icon: Database,
      title: 'Crea un proyecto en Supabase',
      body: 'Entra a supabase.com, crea un proyecto y ejecuta el SQL de supabase/migrations/0001_init.sql en el editor SQL.',
    },
    {
      icon: KeyRound,
      title: 'Copia tus credenciales',
      body: 'En Project Settings → API copia la Project URL y la clave anon public.',
    },
    {
      icon: Terminal,
      title: 'Crea el archivo .env',
      body: 'Copia .env.example a .env, pega tus credenciales y reinicia el servidor (npm run dev).',
    },
  ];

  return (
    <AuthShell>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-content">Configura Urbanix</h1>
        <p className="mt-1.5 text-sm text-content-2">
          Casi listo. Conecta tu base de datos Supabase para empezar.
        </p>
      </div>

      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-3 rounded-lg border border-border bg-surface p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <s.icon className="h-[18px] w-[18px]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-content">
                {i + 1}. {s.title}
              </p>
              <p className="mt-0.5 text-sm text-content-2">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <pre className="mt-5 overflow-auto rounded-lg bg-[#0b0b14] p-4 text-xs text-white/80">
        <code>{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
VITE_SUPABASE_BUCKET=urbanix-files`}</code>
      </pre>

      <div className="mt-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-2xs text-content-3">o</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <Link to="/demo" className="mt-4 block">
        <Button variant="secondary" className="w-full">
          <Sparkles className="h-4 w-4" /> Explorar el demo sin configurar
        </Button>
      </Link>
    </AuthShell>
  );
}
