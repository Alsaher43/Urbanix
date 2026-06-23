-- ════════════════════════════════════════════════════════════════
--  URBANIX · Migración 0003 · Multi-inmobiliaria (multi-tenant) + Auditoría
--
--  Ejecuta DESPUÉS de 0001 y 0002, en el SQL Editor de Supabase.
--  Es RETROCOMPATIBLE: tus datos actuales se agrupan en una organización
--  por defecto ("Mi Inmobiliaria"); nada se borra ni se oculta.
--
--  Tras esta migración:
--   • Cada usuario pertenece a UNA inmobiliaria (organización).
--   • Los datos de una inmobiliaria jamás se mezclan con otra (RLS por org).
--   • El org_id se autoasigna por trigger al insertar (el frontend no cambia).
--   • Permisos: el trabajador puede crear proyectos y subir Excel/planos, pero
--     NO editar lotes/estados/precios/financiamientos (eso es solo del gerente).
--   • Auditoría: audit_log guarda quién, cuándo, qué campo, valor anterior y nuevo.
-- ════════════════════════════════════════════════════════════════

-- ─────────────── Organizaciones ───────────────
create table if not exists public.organizations (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  created_at timestamptz not null default now()
);

-- ─────────────── Columna org_id (nullable primero) ───────────────
alter table public.profiles      add column if not exists org_id uuid references public.organizations(id) on delete set null;
alter table public.projects      add column if not exists org_id uuid references public.organizations(id) on delete cascade;
alter table public.historial     add column if not exists org_id uuid references public.organizations(id) on delete cascade;
alter table public.activity_logs add column if not exists org_id uuid references public.organizations(id) on delete cascade;

create index if not exists idx_profiles_org on public.profiles(org_id);
create index if not exists idx_projects_org on public.projects(org_id);

-- ─────────────── Backfill: mueve los datos existentes a una org por defecto ───────────────
do $$
declare def_org uuid;
begin
  if exists (select 1 from public.profiles where org_id is null)
     or exists (select 1 from public.projects where org_id is null) then
    select id into def_org from public.organizations order by created_at limit 1;
    if def_org is null then
      insert into public.organizations (nombre) values ('Mi Inmobiliaria') returning id into def_org;
    end if;
    update public.profiles      set org_id = def_org where org_id is null;
    update public.projects       set org_id = def_org where org_id is null;
    update public.historial      set org_id = def_org where org_id is null;
    update public.activity_logs  set org_id = def_org where org_id is null;
  end if;
end $$;

-- ─────────────── Helper: org del usuario actual (security definer evita recursión RLS) ───────────────
create or replace function public.current_org()
returns uuid language sql security definer stable set search_path = public as $$
  select org_id from public.profiles where id = auth.uid();
$$;

-- ─────────────── Aprovisionamiento de usuarios nuevos (reescribe handle_new_user) ───────────────
-- Regla:
--   • Si llega org_id en metadata → se usa.
--   • Si no existe ninguna organización → se crea una y el usuario es GERENTE.
--   • Si existe exactamente una → el usuario entra a ella como TRABAJADOR.
--   • Si hay varias y no hay metadata → org_id nulo (el gerente lo asignará); TRABAJADOR.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  org_count integer;
  target_org uuid;
  target_rol public.user_role;
  meta_org uuid;
begin
  begin
    meta_org := nullif(new.raw_user_meta_data->>'org_id', '')::uuid;
  exception when others then meta_org := null; end;

  select count(*) into org_count from public.organizations;

  if meta_org is not null then
    target_org := meta_org;
    target_rol := 'trabajador';
  elsif org_count = 0 then
    insert into public.organizations (nombre)
      values (coalesce(new.raw_user_meta_data->>'org_nombre', 'Mi Inmobiliaria'))
      returning id into target_org;
    target_rol := 'gerente';
  elsif org_count = 1 then
    select id into target_org from public.organizations limit 1;
    target_rol := 'trabajador';
  else
    target_org := null;
    target_rol := 'trabajador';
  end if;

  -- Permite forzar rol vía metadata (p.ej. al invitar a un gerente).
  if (new.raw_user_meta_data->>'rol') in ('gerente','trabajador') then
    target_rol := (new.raw_user_meta_data->>'rol')::public.user_role;
  end if;

  insert into public.profiles (id, email, nombre, rol, org_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    target_rol,
    target_org
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ─────────────── Trigger: autoasigna org_id al insertar (frontend sin cambios) ───────────────
create or replace function public.set_org_from_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.org_id is null then new.org_id := public.current_org(); end if;
  return new;
end;
$$;

drop trigger if exists trg_projects_org on public.projects;
create trigger trg_projects_org before insert on public.projects
  for each row execute function public.set_org_from_user();

drop trigger if exists trg_historial_org on public.historial;
create trigger trg_historial_org before insert on public.historial
  for each row execute function public.set_org_from_user();

drop trigger if exists trg_activity_org on public.activity_logs;
create trigger trg_activity_org before insert on public.activity_logs
  for each row execute function public.set_org_from_user();

-- ─────────────── Auditoría (quién, cuándo, campo, valor anterior → nuevo) ───────────────
create table if not exists public.audit_log (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references public.organizations(id) on delete cascade,
  user_id    uuid references public.profiles(id) on delete set null,
  usuario    text not null,
  project_id uuid references public.projects(id) on delete cascade,
  entity     text not null,            -- p.ej. 'lote'
  entity_id  text,                     -- p.ej. 'A-12'
  field      text not null,            -- 'estado' | 'financiamiento' | 'precio' | ...
  old_value  text,
  new_value  text,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_org on public.audit_log(org_id, created_at desc);

drop trigger if exists trg_audit_org on public.audit_log;
create trigger trg_audit_org before insert on public.audit_log
  for each row execute function public.set_org_from_user();

-- ════════════════════════════════════════════════════════════════
--  RLS por organización (reemplaza las políticas permisivas de 0001/0002)
-- ════════════════════════════════════════════════════════════════
alter table public.organizations enable row level security;
alter table public.audit_log     enable row level security;

-- organizations: cada quien ve su propia organización.
drop policy if exists "org_read" on public.organizations;
create policy "org_read" on public.organizations for select to authenticated
  using (id = public.current_org());
drop policy if exists "org_update" on public.organizations;
create policy "org_update" on public.organizations for update to authenticated
  using (id = public.current_org() and public.is_manager())
  with check (id = public.current_org() and public.is_manager());

-- profiles: ver solo los de mi organización; editar lo mío; el gerente edita los de su org.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or org_id = public.current_org());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_update_manager" on public.profiles;
create policy "profiles_update_manager" on public.profiles for update to authenticated
  using (public.is_manager() and org_id = public.current_org())
  with check (public.is_manager() and org_id = public.current_org());

-- projects: leer los de mi org; CREAR cualquier autenticado de la org (incluye trabajador);
-- modificar/eliminar solo gerente.
drop policy if exists "projects_read" on public.projects;
drop policy if exists "projects_write" on public.projects;
create policy "projects_read" on public.projects for select to authenticated
  using (org_id = public.current_org());
create policy "projects_insert" on public.projects for insert to authenticated
  with check (org_id is null or org_id = public.current_org());
create policy "projects_update" on public.projects for update to authenticated
  using (public.is_manager() and org_id = public.current_org())
  with check (public.is_manager() and org_id = public.current_org());
create policy "projects_delete" on public.projects for delete to authenticated
  using (public.is_manager() and org_id = public.current_org());

-- Helper en línea: ¿el project_id pertenece a mi org?
-- svg_files / excel_files: leer y SUBIR cualquier autenticado de la org; borrar solo gerente.
drop policy if exists "svg_read" on public.svg_files;
drop policy if exists "svg_write" on public.svg_files;
create policy "svg_read" on public.svg_files for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.org_id = public.current_org()));
create policy "svg_insert" on public.svg_files for insert to authenticated
  with check (exists (select 1 from public.projects p where p.id = project_id and p.org_id = public.current_org()));
create policy "svg_modify" on public.svg_files for update to authenticated
  using (public.is_manager() and exists (select 1 from public.projects p where p.id = project_id and p.org_id = public.current_org()));
create policy "svg_delete" on public.svg_files for delete to authenticated
  using (public.is_manager() and exists (select 1 from public.projects p where p.id = project_id and p.org_id = public.current_org()));

drop policy if exists "excel_read" on public.excel_files;
drop policy if exists "excel_write" on public.excel_files;
create policy "excel_read" on public.excel_files for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.org_id = public.current_org()));
create policy "excel_insert" on public.excel_files for insert to authenticated
  with check (exists (select 1 from public.projects p where p.id = project_id and p.org_id = public.current_org()));
create policy "excel_modify" on public.excel_files for update to authenticated
  using (public.is_manager() and exists (select 1 from public.projects p where p.id = project_id and p.org_id = public.current_org()));
create policy "excel_delete" on public.excel_files for delete to authenticated
  using (public.is_manager() and exists (select 1 from public.projects p where p.id = project_id and p.org_id = public.current_org()));

-- lot_overrides: edición de lotes = SOLO gerente de la org.
drop policy if exists "overrides_read" on public.lot_overrides;
drop policy if exists "overrides_write" on public.lot_overrides;
create policy "overrides_read" on public.lot_overrides for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.org_id = public.current_org()));
create policy "overrides_write" on public.lot_overrides for all to authenticated
  using (public.is_manager() and exists (select 1 from public.projects p where p.id = project_id and p.org_id = public.current_org()))
  with check (public.is_manager() and exists (select 1 from public.projects p where p.id = project_id and p.org_id = public.current_org()));

-- historial / activity_logs: ver y registrar dentro de la org.
drop policy if exists "historial_read" on public.historial;
drop policy if exists "historial_insert" on public.historial;
create policy "historial_read" on public.historial for select to authenticated
  using (org_id = public.current_org());
create policy "historial_insert" on public.historial for insert to authenticated
  with check (org_id is null or org_id = public.current_org());

drop policy if exists "activity_read" on public.activity_logs;
drop policy if exists "activity_insert" on public.activity_logs;
create policy "activity_read" on public.activity_logs for select to authenticated
  using (org_id = public.current_org());
create policy "activity_insert" on public.activity_logs for insert to authenticated
  with check (org_id is null or org_id = public.current_org());

-- audit_log: ver y registrar dentro de la org.
drop policy if exists "audit_read" on public.audit_log;
create policy "audit_read" on public.audit_log for select to authenticated
  using (org_id = public.current_org());
drop policy if exists "audit_insert" on public.audit_log;
create policy "audit_insert" on public.audit_log for insert to authenticated
  with check (org_id is null or org_id = public.current_org());

-- Storage: permite SUBIR a cualquier autenticado (los trabajadores ahora pueden);
-- borrar/modificar solo gerente. La lista de archivos sigue acotada por org vía las tablas.
drop policy if exists "urbanix_storage_write" on storage.objects;
create policy "urbanix_storage_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'urbanix-files');

-- ════════════════════════════════════════════════════════════════
--  CREAR OTRA INMOBILIARIA (cuando vendas a una nueva empresa):
--    1) insert into public.organizations (nombre) values ('Nueva Inmobiliaria');
--    2) crea el usuario gerente en Authentication → Users, con User Metadata:
--         { "org_id": "<id-de-la-org>", "rol": "gerente", "nombre": "..." }
--    3) sus trabajadores se crean con metadata { "org_id": "<misma-org>" }.
-- ════════════════════════════════════════════════════════════════
