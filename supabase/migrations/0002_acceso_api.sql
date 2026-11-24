-- Da acceso a la API de Supabase a los usuarios con sesión.
-- Los proyectos nuevos de Supabase pueden no exponer automáticamente las tablas creadas por SQL.
-- Es seguro: lo que cada usuario puede ver o cambiar lo siguen decidiendo las políticas RLS.

grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
grant insert on public.descargas to authenticated;
grant insert, update, delete on
  public.marcas, public.distribuidores, public.distribuidor_marca, public.perfiles,
  public.categorias_marketing, public.materiales
  to authenticated;
grant usage on all sequences in schema public to authenticated;
grant execute on all functions in schema public to authenticated;

-- Los visitantes sin sesión no necesitan nada.
revoke all on all tables in schema public from anon;
