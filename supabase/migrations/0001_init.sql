-- ════════════════════════════════════════════════════════════════
--  URBANIX · Esquema inicial (Supabase / PostgreSQL)
--  Ejecuta este archivo completo en: Supabase → SQL Editor → New query.
--  Crea tablas, roles, triggers, políticas RLS y el bucket de Storage.
-- ════════════════════════════════════════════════════════════════

-- ─────────────── Tipos ───────────────
do $$ begin
  create type public.user_role as enum ('gerente', 'trabajador');
exception when duplicate_object then null; end $$;

-- ─────────────── Tablas ───────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  nombre      text,
  rol         public.user_role not null default 'trabajador',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  descripcion text,
  ubicacion   text,
  owner_id    uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.svg_files (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  nombre       text not null,
  storage_path text not null,
  version      integer not null default 1,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists public.excel_files (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  nombre       text not null,
  storage_path text not null,
  version      integer not null default 1,
  rows_count   integer not null default 0,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create table if not exists public.historial (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  usuario    text not null,
  accion     text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  project_id  uuid references public.projects(id) on delete cascade,
  accion      text not null,
  descripcion text not null,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

-- Índices útiles
create index if not exists idx_svg_project on public.svg_files(project_id, version desc);
create index if not exists idx_excel_project on public.excel_files(project_id, version desc);
create index if not exists idx_historial_created on public.historial(created_at desc);
create index if not exists idx_activity_created on public.activity_logs(created_at desc);

-- ─────────────── Funciones / Triggers ───────────────

-- ¿El usuario actual es gerente? (security definer evita recursión RLS)
create or replace function public.is_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and rol = 'gerente'
  );
$$;

-- Crea automáticamente el perfil al registrarse un usuario en auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
begin
  select count(*) = 0 into is_first from public.profiles;
  insert into public.profiles (id, email, nombre, rol)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    -- El primer usuario registrado se vuelve gerente; el resto, trabajador.
    case when is_first then 'gerente'::public.user_role else 'trabajador'::public.user_role end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mantiene updated_at en projects.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_projects_touch on public.projects;
create trigger trg_projects_touch
  before update on public.projects
  for each row execute function public.touch_updated_at();

-- ─────────────── Row Level Security ───────────────
alter table public.profiles      enable row level security;
alter table public.projects      enable row level security;
alter table public.svg_files     enable row level security;
alter table public.excel_files   enable row level security;
alter table public.historial     enable row level security;
alter table public.activity_logs enable row level security;

-- profiles: todos los autenticados pueden leer; cada quien edita lo suyo;
-- el gerente puede editar cualquier perfil (incluido el rol).
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_update_manager" on public.profiles;
create policy "profiles_update_manager" on public.profiles
  for update to authenticated using (public.is_manager()) with check (public.is_manager());

-- Macro de lectura para autenticados + escritura solo gerente.
-- projects
drop policy if exists "projects_read" on public.projects;
create policy "projects_read" on public.projects for select to authenticated using (true);
drop policy if exists "projects_write" on public.projects;
create policy "projects_write" on public.projects for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

-- svg_files
drop policy if exists "svg_read" on public.svg_files;
create policy "svg_read" on public.svg_files for select to authenticated using (true);
drop policy if exists "svg_write" on public.svg_files;
create policy "svg_write" on public.svg_files for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

-- excel_files
drop policy if exists "excel_read" on public.excel_files;
create policy "excel_read" on public.excel_files for select to authenticated using (true);
drop policy if exists "excel_write" on public.excel_files;
create policy "excel_write" on public.excel_files for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

-- historial / activity_logs: lectura autenticada; inserción para cualquier
-- usuario autenticado (para registrar su login/export); sin update/delete.
drop policy if exists "historial_read" on public.historial;
create policy "historial_read" on public.historial for select to authenticated using (true);
drop policy if exists "historial_insert" on public.historial;
create policy "historial_insert" on public.historial for insert to authenticated with check (true);

drop policy if exists "activity_read" on public.activity_logs;
create policy "activity_read" on public.activity_logs for select to authenticated using (true);
drop policy if exists "activity_insert" on public.activity_logs;
create policy "activity_insert" on public.activity_logs for insert to authenticated with check (true);

-- ─────────────── Storage ───────────────
insert into storage.buckets (id, name, public)
values ('urbanix-files', 'urbanix-files', false)
on conflict (id) do nothing;

-- Lectura para autenticados; escritura/borrado solo gerente.
drop policy if exists "urbanix_storage_read" on storage.objects;
create policy "urbanix_storage_read" on storage.objects
  for select to authenticated using (bucket_id = 'urbanix-files');

drop policy if exists "urbanix_storage_write" on storage.objects;
create policy "urbanix_storage_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'urbanix-files' and public.is_manager());

drop policy if exists "urbanix_storage_modify" on storage.objects;
create policy "urbanix_storage_modify" on storage.objects
  for update to authenticated using (bucket_id = 'urbanix-files' and public.is_manager());

drop policy if exists "urbanix_storage_delete" on storage.objects;
create policy "urbanix_storage_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'urbanix-files' and public.is_manager());

-- ════════════════════════════════════════════════════════════════
--  FIN. El primer usuario que inicie sesión será GERENTE
--  automáticamente. Crea ese usuario en Authentication → Users.
-- ════════════════════════════════════════════════════════════════
