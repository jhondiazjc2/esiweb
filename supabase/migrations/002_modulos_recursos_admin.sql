-- ESIWeb: CRUD de módulos y recursos (documentos, YouTube, enlaces)
-- Ejecutar en SQL Editor después de 001_initial_schema.sql

-- Extender módulos
alter table public.modulos drop constraint if exists modulos_id_check;

alter table public.modulos
  add column if not exists activo boolean not null default true,
  add column if not exists orden int not null default 0,
  add column if not exists updated_at timestamptz not null default now();

update public.modulos set orden = id where orden = 0;

-- Extender materiales → recursos multimodal
alter table public.materiales
  add column if not exists tipo text not null default 'documento'
    check (tipo in ('documento', 'youtube', 'enlace', 'otro')),
  add column if not exists url text,
  add column if not exists archivo_nombre text,
  add column if not exists activo boolean not null default true,
  add column if not exists updated_at timestamptz not null default now();

alter table public.materiales alter column storage_path drop not null;

alter table public.materiales drop constraint if exists materiales_categoria_check;
alter table public.materiales add constraint materiales_categoria_check
  check (categoria in ('cronograma', 'paquete', 'lectura', 'guia', 'video', 'recurso'));

-- Helper: ¿es admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- RLS módulos
drop policy if exists "Modulos visibles autenticados" on public.modulos;
create policy "Modulos visibles autenticados" on public.modulos
  for select to authenticated
  using (activo = true or public.is_admin());

drop policy if exists "Admin gestiona modulos" on public.modulos;
create policy "Admin gestiona modulos" on public.modulos
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- RLS recursos / materiales
drop policy if exists "Material para autenticados" on public.materiales;
drop policy if exists "Recursos activos autenticados" on public.materiales;
create policy "Recursos activos autenticados" on public.materiales
  for select to authenticated
  using (activo = true or public.is_admin());

drop policy if exists "Admin gestiona material" on public.materiales;
create policy "Admin gestiona recursos" on public.materiales
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Storage: bucket materiales (crear si no existe)
insert into storage.buckets (id, name, public, file_size_limit)
values ('materiales', 'materiales', false, 52428800)
on conflict (id) do nothing;

drop policy if exists "Autenticados leen materiales storage" on storage.objects;
create policy "Autenticados leen materiales storage" on storage.objects
  for select to authenticated
  using (bucket_id = 'materiales');

drop policy if exists "Admin sube materiales storage" on storage.objects;
create policy "Admin sube materiales storage" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'materiales' and public.is_admin());

drop policy if exists "Admin actualiza materiales storage" on storage.objects;
create policy "Admin actualiza materiales storage" on storage.objects
  for update to authenticated
  using (bucket_id = 'materiales' and public.is_admin());

drop policy if exists "Admin elimina materiales storage" on storage.objects;
create policy "Admin elimina materiales storage" on storage.objects
  for delete to authenticated
  using (bucket_id = 'materiales' and public.is_admin());
