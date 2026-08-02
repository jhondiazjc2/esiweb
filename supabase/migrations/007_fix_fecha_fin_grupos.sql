-- Corrige fecha_fin proyectada al finalizar el programa (hasta Módulo VI).
-- Semestre actual del reporte jul 2026 cierra 2026-06-30; luego se suman
-- los semestres restantes (6 - modulo_id).

update public.grupos_esi
set
  fecha_fin = case modulo_id
    when 1 then date '2028-12-31'
    when 2 then date '2028-06-30'
    when 3 then date '2027-12-31'
    when 4 then date '2027-06-30'
    when 5 then date '2026-12-31'
    when 6 then date '2026-06-30'
    else fecha_fin
  end,
  updated_at = now()
where modulo_id between 1 and 6;
