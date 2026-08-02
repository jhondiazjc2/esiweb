-- ESIWeb 006: acceso por rol, usuario activo y visibilidad de carpetas
-- Ejecutar en Supabase → SQL Editor DESPUÉS de 005_grupos_esi.sql
--
-- Reglas:
-- - profiles.activo = false → sin acceso a contenido (además conviene banear en Auth)
-- - estudiante → solo módulo(s) de sus grupos activos + carpetas visibles para estudiante
-- - facilitador → todos los módulos activos, lectura (sin políticas de escritura)
-- - admin → CRUD completo

-- ─── 1. Usuario activo en profiles ──────────────────────────────────────────
alter table public.profiles
  add column if not exists activo boolean not null default true;

alter table public.profiles
  add column if not exists motivo_salida text
    check (
      motivo_salida is null
      or motivo_salida in ('desercion', 'finalizado', 'otro')
    );

alter table public.profiles
  add column if not exists fecha_salida date;

comment on column public.profiles.activo is
  'Si false, el usuario no debe acceder a ESIWeb. Complementar con ban en Auth.';

-- ─── 2. Visibilidad de carpetas por audiencia ───────────────────────────────
-- Valores permitidos en el arreglo: estudiante | facilitador | admin
alter table public.modulo_carpetas
  add column if not exists visible_para text[] not null default array['estudiante', 'facilitador', 'admin']::text[];

alter table public.modulo_carpetas
  drop constraint if exists modulo_carpetas_visible_para_check;

alter table public.modulo_carpetas
  add constraint modulo_carpetas_visible_para_check
  check (
    visible_para <@ array['estudiante', 'facilitador', 'admin']::text[]
    and cardinality(visible_para) >= 1
  );

-- Semilla por nombre de carpeta plantilla
update public.modulo_carpetas
set visible_para = array['estudiante', 'facilitador', 'admin']::text[]
where nombre in ('Material de estudio', 'Formatos');

update public.modulo_carpetas
set visible_para = array['facilitador', 'admin']::text[]
where nombre = 'Documentos facilitador';

-- ─── 3. Helpers de rol y acceso (security definer) ──────────────────────────
create or replace function public.is_profile_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and activo = true
  );
$$;

-- Rol de aplicación en profiles (admin | facilitador | estudiante)
create or replace function public.app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role::text from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_profile_active() and public.app_role() = 'admin';
$$;

create or replace function public.is_facilitador()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_profile_active()
    and (
      public.app_role() = 'facilitador'
      or exists (
        select 1
        from public.profiles p
        join public.grupo_miembros gm
          on gm.persona_id = p.persona_id
         and gm.rol = 'facilitador'
         and gm.activo = true
        where p.id = auth.uid()
      )
    );
$$;

-- Módulos que un estudiante puede ver (grupos activos donde es estudiante)
create or replace function public.estudiante_modulos_permitidos()
returns setof int
language sql
stable
security definer
set search_path = public
as $$
  select distinct g.modulo_id
  from public.profiles p
  join public.grupo_miembros gm
    on gm.persona_id = p.persona_id
   and gm.rol = 'estudiante'
   and gm.activo = true
  join public.grupos_esi g
    on g.id = gm.grupo_id
   and g.activo = true
  where p.id = auth.uid()
    and p.activo = true
    and g.modulo_id is not null;
$$;

-- ¿Puede ver este módulo?
create or replace function public.can_view_modulo(p_modulo_id int)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_profile_active()
    and (
      public.is_admin()
      or public.is_facilitador()
      or p_modulo_id in (select public.estudiante_modulos_permitidos())
      -- Fallback si aún no hay grupo_miembros: profiles.modulo_actual
      or (
        public.app_role() = 'estudiante'
        and exists (
          select 1 from public.profiles
          where id = auth.uid()
            and modulo_actual = p_modulo_id
            and persona_id is null
        )
      )
    );
$$;

-- ¿Puede ver esta carpeta según visible_para?
create or replace function public.can_view_carpeta(p_visible_para text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_profile_active()
    and (
      public.is_admin()
      or (
        public.is_facilitador()
        and (
          'facilitador' = any (p_visible_para)
          or 'admin' = any (p_visible_para)
        )
      )
      or (
        public.app_role() = 'estudiante'
        and not public.is_facilitador()
        and 'estudiante' = any (p_visible_para)
      )
    );
$$;

-- ─── 4. RLS módulos ─────────────────────────────────────────────────────────
drop policy if exists "Modulos visibles autenticados" on public.modulos;
create policy "Modulos visibles autenticados" on public.modulos
  for select to authenticated
  using (
    public.is_profile_active()
    and (activo = true or public.is_admin())
    and public.can_view_modulo(id)
  );

drop policy if exists "Admin gestiona modulos" on public.modulos;
create policy "Admin gestiona modulos" on public.modulos
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── 5. RLS carpetas ────────────────────────────────────────────────────────
drop policy if exists "Carpetas visibles autenticados" on public.modulo_carpetas;
create policy "Carpetas visibles autenticados" on public.modulo_carpetas
  for select to authenticated
  using (
    public.can_view_modulo(modulo_id)
    and public.can_view_carpeta(visible_para)
    and exists (
      select 1 from public.modulos m
      where m.id = modulo_id and (m.activo = true or public.is_admin())
    )
  );

drop policy if exists "Admin gestiona carpetas" on public.modulo_carpetas;
create policy "Admin gestiona carpetas" on public.modulo_carpetas
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── 6. RLS materiales / recursos ───────────────────────────────────────────
drop policy if exists "Recursos activos autenticados" on public.materiales;
drop policy if exists "Material para autenticados" on public.materiales;
create policy "Recursos visibles segun acceso" on public.materiales
  for select to authenticated
  using (
    (activo = true or public.is_admin())
    and public.can_view_modulo(modulo_id)
    and (
      -- Sin carpeta: visible si puede ver el módulo
      carpeta_id is null
      or exists (
        select 1 from public.modulo_carpetas c
        where c.id = carpeta_id
          and public.can_view_carpeta(c.visible_para)
      )
      -- Metadatos de carpetas virtuales (labels/extras): solo admin
      or (
        public.is_admin()
        and storage_path is not null
        and (
          storage_path like 'folder-label:%'
          or storage_path like 'folder-extra:%'
          or storage_path like 'deleted:%'
        )
      )
    )
  );

drop policy if exists "Admin gestiona recursos" on public.materiales;
drop policy if exists "Admin gestiona material" on public.materiales;
create policy "Admin gestiona recursos" on public.materiales
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─── 7. Storage: lectura solo si perfil activo ──────────────────────────────
drop policy if exists "Autenticados leen materiales storage" on storage.objects;
create policy "Autenticados activos leen materiales storage" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'materiales'
    and public.is_profile_active()
  );
