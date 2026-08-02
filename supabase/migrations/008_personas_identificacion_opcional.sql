-- Permite identificación provisional o completar datos después.
-- (Los facilitadores importados usarán cédulas ficticias 11111111, 11111112, …)

alter table public.personas
  alter column identificacion drop not null;

alter table public.personas
  drop constraint if exists personas_identificacion_nonempty;

alter table public.personas
  add constraint personas_identificacion_nonempty check (
    identificacion is null
    or length(trim(identificacion)) = 0
    or length(public.normalize_identificacion(identificacion)) > 0
  );

drop index if exists personas_identificacion_uidx;

create unique index if not exists personas_identificacion_uidx
  on public.personas (public.normalize_identificacion(identificacion))
  where identificacion is not null
    and length(public.normalize_identificacion(identificacion)) > 0;
