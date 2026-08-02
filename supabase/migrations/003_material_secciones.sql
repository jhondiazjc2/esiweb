-- Alinear categorías con subcarpetas de material:
-- Material de estudio / Formatos / Documentos facilitador

alter table public.materiales drop constraint if exists materiales_categoria_check;
alter table public.materiales add constraint materiales_categoria_check
  check (categoria in (
    'material_estudio',
    'formato',
    'documento_facilitador',
    'video',
    'recurso',
    'cronograma',
    'paquete',
    'lectura',
    'guia'
  ));

update public.materiales
set categoria = case categoria
  when 'paquete' then 'material_estudio'
  when 'lectura' then 'material_estudio'
  when 'cronograma' then 'material_estudio'
  when 'guia' then 'documento_facilitador'
  else categoria
end
where categoria in ('paquete', 'lectura', 'cronograma', 'guia');
