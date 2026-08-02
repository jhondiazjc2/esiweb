-- Evita recursión infinita en RLS de grupo_miembros.
-- La política de facilitador consultaba grupo_miembros dentro de sí misma.

create or replace function public.es_facilitador_del_grupo(p_grupo_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.grupo_miembros fm
      on fm.persona_id = p.persona_id
     and fm.rol = 'facilitador'
     and fm.activo = true
     and fm.grupo_id = p_grupo_id
    where p.id = auth.uid()
      and p.role in ('facilitador', 'admin')
  );
$$;

drop policy if exists "Facilitador gestiona estudiantes de sus grupos"
  on public.grupo_miembros;

create policy "Facilitador gestiona estudiantes de sus grupos"
  on public.grupo_miembros for all
  to authenticated
  using (
    rol = 'estudiante'
    and public.es_facilitador_del_grupo(grupo_id)
  )
  with check (
    rol = 'estudiante'
    and public.es_facilitador_del_grupo(grupo_id)
  );

-- Lectura: admin/facilitador de app, o la propia persona (sin auto-join recursivo)
drop policy if exists "Miembros de grupo visibles a autenticados del contexto"
  on public.grupo_miembros;

create policy "Miembros de grupo visibles a autenticados del contexto"
  on public.grupo_miembros for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (
          p.role in ('admin', 'facilitador')
          or p.persona_id = grupo_miembros.persona_id
        )
    )
  );
