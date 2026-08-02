-- Rol de aplicación en personas (además del rol por grupo en grupo_miembros).
-- Todos los facilitadores creados → facilitador.
-- Sebastián Moreno y Jhon Jairo Díaz → admin (también pueden facilitar grupos).

alter table public.personas
  add column if not exists app_role public.user_role not null default 'facilitador';

comment on column public.personas.app_role is
  'Rol en ESIWeb: admin | facilitador | estudiante. Independiente del rol en grupo_miembros.';

-- Por defecto: quienes son facilitadores de grupo
update public.personas p
set app_role = 'facilitador'
where exists (
  select 1 from public.grupo_miembros gm
  where gm.persona_id = p.id
    and gm.rol = 'facilitador'
    and gm.activo = true
);

-- Admins explícitos (por nombre normalizado)
update public.personas
set app_role = 'admin'
where public.normalize_nombre(nombre_completo) in (
  'sebastian moreno',
  'sebastián moreno',
  'jhon jairo diaz',
  'jhon jairo díaz'
);

-- Si ya tienen profile vinculado, sincronizar rol de app (sin bajar a un admin existente no listado)
update public.profiles pr
set role = p.app_role
from public.personas p
where pr.persona_id = p.id
  and p.app_role = 'admin';

-- Vincular por nombre si el profile aún no tiene persona_id
update public.profiles pr
set
  persona_id = p.id,
  role = p.app_role
from public.personas p
where pr.persona_id is null
  and public.normalize_nombre(pr.full_name) = public.normalize_nombre(p.nombre_completo)
  and p.app_role in ('admin', 'facilitador');
