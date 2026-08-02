-- ESIWeb: Grupos ESI, personas y membresías (reemplaza el modelo sedes/grupos simple)
-- Una persona puede ser admin (profiles.role), y a la vez facilitador/estudiante
-- en distintos grupos vía grupo_miembros.

create extension if not exists pg_trgm;

-- Rol dentro de un grupo (no confundir con profiles.role de la app)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'grupo_miembro_rol') then
    create type public.grupo_miembro_rol as enum ('facilitador', 'estudiante');
  end if;
end$$;

-- Normaliza cédula/documento: solo dígitos y letras
create or replace function public.normalize_identificacion(value text)
returns text
language sql
immutable
as $$
  select nullif(upper(regexp_replace(trim(coalesce(value, '')), '[^0-9A-Za-z]', '', 'g')), '');
$$;

-- Nombre en minúsculas colapsando espacios (para búsqueda / posibles duplicados)
create or replace function public.normalize_nombre(value text)
returns text
language sql
immutable
as $$
  select nullif(
    lower(regexp_replace(trim(coalesce(value, '')), '\s+', ' ', 'g')),
    ''
  );
$$;

-- ─── Personas (fuente única de gente) ───────────────────────────────────────
create table if not exists public.personas (
  id uuid primary key default gen_random_uuid(),
  identificacion text not null,
  nombre_completo text not null,
  nombre_normalizado text generated always as (
    public.normalize_nombre(nombre_completo)
  ) stored,
  iglesia_local text,
  email text,
  telefono text,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint personas_identificacion_nonempty check (
    length(public.normalize_identificacion(identificacion)) > 0
  )
);

-- Cédula única (normalizada): evita el mismo documento dos veces
create unique index if not exists personas_identificacion_uidx
  on public.personas (public.normalize_identificacion(identificacion));

-- Email único cuando exista (login futuro)
create unique index if not exists personas_email_uidx
  on public.personas (lower(email))
  where email is not null and length(trim(email)) > 0;

-- Apoyo a detección de homónimos (no es UNIQUE: hay nombres repetidos)
create index if not exists personas_nombre_trgm_idx
  on public.personas using gin (nombre_normalizado gin_trgm_ops);

create index if not exists personas_iglesia_idx
  on public.personas (iglesia_local);

-- ─── Grupos ESI ───────────────────────────────────────────────────────────
create table if not exists public.grupos_esi (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ciudad text not null,
  fecha_inicio date,
  fecha_fin date,
  modulo_id int references public.modulos (id) on delete set null,
  activo boolean not null default true,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grupos_esi_fechas_check check (
    fecha_fin is null
    or fecha_inicio is null
    or fecha_fin >= fecha_inicio
  )
);

create index if not exists grupos_esi_ciudad_idx on public.grupos_esi (ciudad);
create index if not exists grupos_esi_modulo_id_idx on public.grupos_esi (modulo_id);
create index if not exists grupos_esi_activo_idx on public.grupos_esi (activo);

-- ─── Membresía por grupo (N facilitadores, roles cruzados) ─────────────────
create table if not exists public.grupo_miembros (
  id uuid primary key default gen_random_uuid(),
  grupo_id uuid not null references public.grupos_esi (id) on delete cascade,
  persona_id uuid not null references public.personas (id) on delete cascade,
  rol public.grupo_miembro_rol not null,
  fecha_ingreso date default current_date,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  -- Misma persona puede ser estudiante Y facilitador en el MISMO grupo
  -- (dos filas). En grupos distintos, libremente.
  unique (grupo_id, persona_id, rol)
);

create index if not exists grupo_miembros_grupo_id_idx
  on public.grupo_miembros (grupo_id);
create index if not exists grupo_miembros_persona_id_idx
  on public.grupo_miembros (persona_id);
create index if not exists grupo_miembros_rol_idx
  on public.grupo_miembros (rol);

-- ─── Vincular profiles (Auth) con personas ────────────────────────────────
alter table public.profiles
  add column if not exists persona_id uuid references public.personas (id)
    on delete set null;

create unique index if not exists profiles_persona_id_uidx
  on public.profiles (persona_id)
  where persona_id is not null;

-- Comentario de deprecación del modelo anterior (sedes / grupos)
comment on table public.sedes is
  'DEPRECATED: usar grupos_esi + ciudad. Se mantiene por compatibilidad.';
comment on table public.grupos is
  'DEPRECATED: usar grupos_esi + grupo_miembros. Se mantiene por compatibilidad.';

-- ─── RLS ──────────────────────────────────────────────────────────────────
alter table public.personas enable row level security;
alter table public.grupos_esi enable row level security;
alter table public.grupo_miembros enable row level security;

-- Lectura: autenticados ven grupos activos y membresías
create policy "Grupos ESI activos visibles"
  on public.grupos_esi for select
  to authenticated
  using (activo = true or exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

create policy "Admin gestiona grupos ESI"
  on public.grupos_esi for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Personas: ver propias o admin/facilitador"
  on public.personas for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.persona_id = personas.id or p.role in ('admin', 'facilitador'))
    )
  );

create policy "Admin gestiona personas"
  on public.personas for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Miembros de grupo visibles a autenticados del contexto"
  on public.grupo_miembros for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'facilitador')
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.persona_id = grupo_miembros.persona_id
    )
  );

create policy "Admin gestiona miembros de grupo"
  on public.grupo_miembros for all
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Facilitador puede gestionar estudiantes de sus grupos
create policy "Facilitador gestiona estudiantes de sus grupos"
  on public.grupo_miembros for all
  using (
    rol = 'estudiante'
    and exists (
      select 1
      from public.profiles p
      join public.grupo_miembros fm
        on fm.persona_id = p.persona_id
       and fm.rol = 'facilitador'
       and fm.activo = true
      where p.id = auth.uid()
        and p.role in ('facilitador', 'admin')
        and fm.grupo_id = grupo_miembros.grupo_id
    )
  )
  with check (
    rol = 'estudiante'
    and exists (
      select 1
      from public.profiles p
      join public.grupo_miembros fm
        on fm.persona_id = p.persona_id
       and fm.rol = 'facilitador'
       and fm.activo = true
      where p.id = auth.uid()
        and p.role in ('facilitador', 'admin')
        and fm.grupo_id = grupo_miembros.grupo_id
    )
  );

-- Migración suave: sedes activas → grupos_esi (si aún no hay grupos)
insert into public.grupos_esi (nombre, ciudad, activo, notas)
select
  s.nombre,
  s.ciudad,
  s.activa,
  case when s.contacto is not null then 'Contacto legado: ' || s.contacto else null end
from public.sedes s
where not exists (select 1 from public.grupos_esi limit 1)
on conflict do nothing;
