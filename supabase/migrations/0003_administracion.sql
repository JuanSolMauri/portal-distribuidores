-- Administración desde el portal: tercera marca y alta de usuarios por email.

insert into public.marcas (slug, nombre) values ('olevi', 'Olevi')
on conflict (slug) do nothing;

-- El usuario se crea en Supabase (Authentication → Users → Add user);
-- esta función le da acceso al portal: nombre, rol y cliente. Solo para admin.
create or replace function public.dar_acceso(p_email text, p_nombre text, p_rol public.rol_usuario, p_distribuidor uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  if public.mi_rol() is distinct from 'admin' then
    raise exception 'Solo un administrador puede dar acceso.';
  end if;
  select id into v_id from auth.users where lower(email) = lower(trim(p_email));
  if v_id is null then
    raise exception 'No existe ningún usuario con el email %. Créalo primero en Supabase: Authentication, Users, Add user.', trim(p_email);
  end if;
  insert into public.perfiles (id, nombre, rol, distribuidor_id)
  values (v_id, trim(p_nombre), p_rol, p_distribuidor)
  on conflict (id) do update
    set nombre = excluded.nombre, rol = excluded.rol, distribuidor_id = excluded.distribuidor_id;
end
$$;

-- Lista de usuarios con su email, solo para internos.
create or replace function public.listar_usuarios()
returns table (id uuid, email text, nombre text, rol public.rol_usuario, distribuidor_id uuid)
language sql stable security definer set search_path = public
as $$
  select p.id, u.email::text, p.nombre, p.rol, p.distribuidor_id
  from public.perfiles p
  join auth.users u on u.id = p.id
  where public.es_interno()
  order by p.nombre
$$;

revoke all on function public.dar_acceso(text, text, public.rol_usuario, uuid) from public, anon;
revoke all on function public.listar_usuarios() from public, anon;
grant execute on function public.dar_acceso(text, text, public.rol_usuario, uuid) to authenticated;
grant execute on function public.listar_usuarios() to authenticated;
