-- Carpetas dinámicas por módulo (además de las 3 sugeridas)

create table if not exists public.modulo_carpetas (
  id uuid primary key default gen_random_uuid(),
  modulo_id int not null references public.modulos (id) on delete cascade,
  nombre text not null,
  orden int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (modulo_id, nombre)
);

create index if not exists modulo_carpetas_modulo_id_idx
  on public.modulo_carpetas (modulo_id, orden);

alter table public.materiales
  add column if not exists carpeta_id uuid references public.modulo_carpetas (id) on delete set null;

create index if not exists materiales_carpeta_id_idx
  on public.materiales (carpeta_id);

-- Permitir categoría libre (la carpeta es la fuente de organización)
alter table public.materiales drop constraint if exists materiales_categoria_check;

-- Sembrar carpetas por defecto en módulos existentes
insert into public.modulo_carpetas (modulo_id, nombre, orden)
select m.id, v.nombre, v.orden
from public.modulos m
cross join (
  values
    ('Material de estudio', 1),
    ('Formatos', 2),
    ('Documentos facilitador', 3)
) as v(nombre, orden)
on conflict (modulo_id, nombre) do nothing;

-- Vincular materiales existentes según categoría legacy
update public.materiales mat
set carpeta_id = c.id
from public.modulo_carpetas c
where mat.modulo_id = c.modulo_id
  and mat.carpeta_id is null
  and (
    (mat.categoria in ('material_estudio', 'paquete', 'lectura', 'cronograma')
      and c.nombre = 'Material de estudio')
    or (mat.categoria = 'formato' and c.nombre = 'Formatos')
    or (mat.categoria in ('documento_facilitador', 'guia')
      and c.nombre = 'Documentos facilitador')
  );

-- RLS
alter table public.modulo_carpetas enable row level security;

drop policy if exists "Carpetas visibles autenticados" on public.modulo_carpetas;
create policy "Carpetas visibles autenticados" on public.modulo_carpetas
  for select to authenticated
  using (
    exists (
      select 1 from public.modulos m
      where m.id = modulo_id and (m.activo = true or public.is_admin())
    )
  );

drop policy if exists "Admin gestiona carpetas" on public.modulo_carpetas;
create policy "Admin gestiona carpetas" on public.modulo_carpetas
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
