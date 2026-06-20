-- ════════════════════════════════════════════════════════════════
--  URBANIX · Migración 0002 · Edición de estados in-app
--  Ejecuta este archivo DESPUÉS de 0001_init.sql en el SQL Editor.
--  Guarda cambios de estado/financiamiento por lote sin tocar el Excel
--  original. El visualizador y la tabla fusionan estos overrides.
-- ════════════════════════════════════════════════════════════════

create table if not exists public.lot_overrides (
  id             uuid primary key default gen_random_uuid(),
  project_id     uuid not null references public.projects(id) on delete cascade,
  lote_id        text not null,
  estado         text,
  financiamiento text,
  updated_by     uuid references public.profiles(id) on delete set null,
  updated_at     timestamptz not null default now(),
  unique (project_id, lote_id)
);

create index if not exists idx_overrides_project on public.lot_overrides(project_id);

-- updated_at automático
drop trigger if exists trg_overrides_touch on public.lot_overrides;
create trigger trg_overrides_touch
  before update on public.lot_overrides
  for each row execute function public.touch_updated_at();

-- RLS: lectura autenticada; escritura solo gerente.
alter table public.lot_overrides enable row level security;

drop policy if exists "overrides_read" on public.lot_overrides;
create policy "overrides_read" on public.lot_overrides
  for select to authenticated using (true);

drop policy if exists "overrides_write" on public.lot_overrides;
create policy "overrides_write" on public.lot_overrides
  for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

-- (Opcional) Habilita realtime para ver cambios en vivo entre usuarios:
-- en Supabase → Database → Replication, añade `lot_overrides` a la publicación
-- `supabase_realtime`, o ejecuta:
--   alter publication supabase_realtime add table public.lot_overrides;
