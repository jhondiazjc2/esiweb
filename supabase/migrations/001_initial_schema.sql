-- ESIWeb: esquema inicial de base de datos
-- Ejecutar en el SQL Editor de Supabase

-- Roles de usuario
create type public.user_role as enum ('estudiante', 'facilitador', 'admin');

-- Sedes (ciudades / grupos regionales)
create table public.sedes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ciudad text not null,
  contacto text,
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

-- Grupos dentro de una sede
create table public.grupos (
  id uuid primary key default gen_random_uuid(),
  sede_id uuid not null references public.sedes(id) on delete cascade,
  nombre text not null,
  facilitador_id uuid references auth.users(id),
  modulo_actual int not null default 1 check (modulo_actual between 1 and 6),
  created_at timestamptz not null default now()
);

-- Perfiles vinculados a auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.user_role not null default 'estudiante',
  sede_id uuid references public.sedes(id),
  grupo_id uuid references public.grupos(id),
  modulo_actual int not null default 1 check (modulo_actual between 1 and 6),
  created_at timestamptz not null default now()
);

-- Módulos del programa (catálogo)
create table public.modulos (
  id int primary key check (id between 1 and 6),
  titulo text not null,
  descripcion text not null,
  semanas int not null default 15
);

-- Material de estudio (PDFs en Supabase Storage)
create table public.materiales (
  id uuid primary key default gen_random_uuid(),
  modulo_id int not null references public.modulos(id),
  titulo text not null,
  descripcion text,
  categoria text not null check (categoria in ('cronograma', 'paquete', 'lectura', 'guia')),
  storage_path text not null,
  semana int,
  orden int not null default 0,
  created_at timestamptz not null default now()
);

-- Notas semanales por estudiante
create table public.notas (
  id uuid primary key default gen_random_uuid(),
  estudiante_id uuid not null references public.profiles(id) on delete cascade,
  modulo_id int not null references public.modulos(id),
  semana int not null check (semana between 1 and 15),
  nota numeric(3,1) check (nota between 0 and 5),
  observacion text,
  registrado_por uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (estudiante_id, modulo_id, semana)
);

-- Trigger: crear perfil al registrar usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'estudiante')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.sedes enable row level security;
alter table public.grupos enable row level security;
alter table public.profiles enable row level security;
alter table public.modulos enable row level security;
alter table public.materiales enable row level security;
alter table public.notas enable row level security;

-- Lectura pública de sedes activas
create policy "Sedes activas visibles" on public.sedes
  for select using (activa = true);

-- Perfiles: cada usuario ve el suyo; facilitadores/admin ven más
create policy "Ver propio perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "Actualizar propio perfil" on public.profiles
  for update using (auth.uid() = id);

-- Material: usuarios autenticados pueden leer
create policy "Material para autenticados" on public.materiales
  for select to authenticated using (true);

create policy "Admin gestiona material" on public.materiales
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Notas: estudiante ve las suyas; facilitador las de su grupo
create policy "Estudiante ve sus notas" on public.notas
  for select using (estudiante_id = auth.uid());

-- Datos iniciales de módulos
insert into public.modulos (id, titulo, descripcion) values
  (1, 'Fundamentos para estudiar la Biblia', 'Romanos 1-4'),
  (2, 'Fundamentos para entender el evangelio', 'Romanos 5-8'),
  (3, 'Fundamentos para la vida santa', 'Romanos 9-11'),
  (4, 'Fundamentos para la predicación bíblica', 'Romanos 12-16'),
  (5, 'Fundamentos para el liderazgo y consejería bíblica', 'II Timoteo 1-4'),
  (6, 'Fundamentos para impactar el mundo bíblicamente', 'Efesios 1-6');

-- Bucket de Storage (crear desde el panel: materiales, privado)
-- Política sugerida: lectura autenticada, escritura solo admin
