-- Portal de distribuidores: esquema base con permisos por marca.
-- Regla principal: un distribuidor solo ve datos de su empresa y de sus marcas autorizadas.
-- La regla se aplica en la base de datos (Row Level Security), no solo en la web.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table public.marcas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  nombre text not null,
  descripcion text,
  creado_en timestamptz not null default now()
);

create table public.distribuidores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  pais text not null,
  territorio text,
  idioma text not null default 'es',
  moneda text not null default 'EUR',
  codigo_erp text,
  activo boolean not null default true,
  creado_en timestamptz not null default now()
);

-- Qué marcas puede llevar cada distribuidor, dónde y hasta cuándo.
create table public.distribuidor_marca (
  distribuidor_id uuid not null references public.distribuidores(id) on delete cascade,
  marca_id uuid not null references public.marcas(id) on delete cascade,
  territorio text,
  fecha_inicio date not null default current_date,
  fecha_fin date,
  activa boolean not null default true,
  primary key (distribuidor_id, marca_id)
);

create type public.rol_usuario as enum (
  'admin',          -- dirección / IT: todo
  'gestor',         -- equipo comercial de exportación
  'marketing',      -- equipo de marketing interno
  'dist_admin',     -- responsable del distribuidor
  'dist_usuario'    -- equipo del distribuidor
);

-- Perfil de cada usuario de Supabase Auth.
create table public.perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol public.rol_usuario not null default 'dist_usuario',
  distribuidor_id uuid references public.distribuidores(id) on delete set null,
  idioma text not null default 'es',
  creado_en timestamptz not null default now(),
  constraint distribuidor_obligatorio check (
    rol in ('admin', 'gestor', 'marketing') or distribuidor_id is not null
  )
);

-- Categorías de material. Reflejan las carpetas de Drive "Internacional":
--   comun    -> Comun/<Marca>/<Categoría>: lo ven todos los clientes con esa marca.
--   cliente  -> Clientes/<Cliente>/<Categoría>: solo lo ve ese cliente.
create table public.categorias_marketing (
  slug text primary key check (slug ~ '^[a-z0-9-]+$'),
  nombre text not null,
  ambito text not null default 'comun' check (ambito in ('comun', 'cliente')),
  orden int not null default 0
);

create table public.materiales (
  id uuid primary key default gen_random_uuid(),
  -- Material común: marca obligatoria, sin distribuidor.
  -- Material de cliente: distribuidor obligatorio; la marca es opcional (un contrato puede cubrir varias).
  marca_id uuid references public.marcas(id) on delete cascade,
  distribuidor_id uuid references public.distribuidores(id) on delete cascade,
  categoria text not null references public.categorias_marketing(slug),
  titulo text not null,
  -- Ruta en el bucket "marketing":
  --   comun/<slug-marca>/<slug-categoria>/<archivo>
  --   clientes/<id-distribuidor>/<slug-categoria>/<archivo>
  ruta_archivo text not null unique,
  mime text,
  tamano_bytes bigint,
  idioma text,
  publicado boolean not null default true,
  publicado_en timestamptz not null default now(),
  constraint comun_o_cliente check (
    (distribuidor_id is null and marca_id is not null and ruta_archivo like 'comun/%/%/%')
    or (distribuidor_id is not null and ruta_archivo like 'clientes/' || distribuidor_id::text || '/%/%')
  )
);

create index materiales_marca_categoria on public.materiales (marca_id, categoria);
create index materiales_distribuidor on public.materiales (distribuidor_id);

create table public.descargas (
  id bigint generated always as identity primary key,
  material_id uuid not null references public.materiales(id) on delete cascade,
  usuario_id uuid not null references auth.users(id) on delete cascade,
  descargado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Funciones de permisos (security definer para que no recurran en RLS)
-- ---------------------------------------------------------------------------

create or replace function public.mi_rol()
returns public.rol_usuario
language sql stable security definer set search_path = public
as $$ select rol from public.perfiles where id = auth.uid() $$;

create or replace function public.es_interno()
returns boolean
language sql stable security definer set search_path = public
as $$ select coalesce(public.mi_rol() in ('admin', 'gestor', 'marketing'), false) $$;

create or replace function public.mi_distribuidor()
returns uuid
language sql stable security definer set search_path = public
as $$ select distribuidor_id from public.perfiles where id = auth.uid() $$;

-- Marcas activas y vigentes del distribuidor del usuario.
create or replace function public.mis_marcas()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select dm.marca_id
  from public.distribuidor_marca dm
  join public.distribuidores d on d.id = dm.distribuidor_id
  where dm.distribuidor_id = public.mi_distribuidor()
    and d.activo
    and dm.activa
    and dm.fecha_inicio <= current_date
    and (dm.fecha_fin is null or dm.fecha_fin >= current_date)
$$;

create or replace function public.puede_ver_marca(p_marca uuid)
returns boolean
language sql stable security definer set search_path = public
as $$ select public.es_interno() or p_marca in (select public.mis_marcas()) $$;

-- Regla única para materiales y sus archivos.
create or replace function public.puede_ver_material(p_marca uuid, p_distribuidor uuid, p_publicado boolean)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.es_interno() or (
    p_publicado
    and case
      when p_distribuidor is null then p_marca in (select public.mis_marcas())
      else p_distribuidor = public.mi_distribuidor()
           and (p_marca is null or p_marca in (select public.mis_marcas()))
    end
  )
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.marcas enable row level security;
alter table public.distribuidores enable row level security;
alter table public.distribuidor_marca enable row level security;
alter table public.perfiles enable row level security;
alter table public.categorias_marketing enable row level security;
alter table public.materiales enable row level security;
alter table public.descargas enable row level security;

-- Marcas
create policy marcas_leer on public.marcas for select
  using (public.puede_ver_marca(id));
create policy marcas_admin on public.marcas for all
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');

-- Distribuidores
create policy distribuidores_leer on public.distribuidores for select
  using (public.es_interno() or id = public.mi_distribuidor());
create policy distribuidores_gestion on public.distribuidores for all
  using (public.mi_rol() in ('admin', 'gestor'))
  with check (public.mi_rol() in ('admin', 'gestor'));

-- Marcas por distribuidor
create policy dm_leer on public.distribuidor_marca for select
  using (public.es_interno() or distribuidor_id = public.mi_distribuidor());
create policy dm_gestion on public.distribuidor_marca for all
  using (public.mi_rol() in ('admin', 'gestor'))
  with check (public.mi_rol() in ('admin', 'gestor'));

-- Perfiles: cada uno ve el suyo; el admin del distribuidor ve su equipo; internos ven todos.
create policy perfiles_leer on public.perfiles for select
  using (
    id = auth.uid()
    or public.es_interno()
    or (public.mi_rol() = 'dist_admin' and distribuidor_id = public.mi_distribuidor())
  );
create policy perfiles_gestion on public.perfiles for all
  using (public.mi_rol() = 'admin') with check (public.mi_rol() = 'admin');

-- Categorías: lectura para cualquier usuario con sesión.
create policy categorias_leer on public.categorias_marketing for select
  using (auth.uid() is not null);
create policy categorias_gestion on public.categorias_marketing for all
  using (public.mi_rol() in ('admin', 'marketing'))
  with check (public.mi_rol() in ('admin', 'marketing'));

-- Materiales: comunes de sus marcas + los de su propia carpeta de cliente.
create policy materiales_leer on public.materiales for select
  using (public.puede_ver_material(marca_id, distribuidor_id, publicado));
create policy materiales_gestion on public.materiales for all
  using (public.mi_rol() in ('admin', 'marketing'))
  with check (public.mi_rol() in ('admin', 'marketing'));

-- Descargas: cada usuario registra las suyas; internos ven todas.
create policy descargas_insertar on public.descargas for insert
  with check (usuario_id = auth.uid());
create policy descargas_leer on public.descargas for select
  using (usuario_id = auth.uid() or public.es_interno());

-- ---------------------------------------------------------------------------
-- Almacenamiento de archivos (bucket privado "marketing")
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('marketing', 'marketing', false)
on conflict (id) do nothing;

-- Un archivo se puede leer solo si su material existe y el usuario puede verlo.
create policy marketing_leer on storage.objects for select
  using (
    bucket_id = 'marketing'
    and exists (
      select 1 from public.materiales m
      where m.ruta_archivo = storage.objects.name
        and public.puede_ver_material(m.marca_id, m.distribuidor_id, m.publicado)
    )
  );

create policy marketing_subir on storage.objects for insert
  with check (bucket_id = 'marketing' and public.mi_rol() in ('admin', 'marketing'));
create policy marketing_modificar on storage.objects for update
  using (bucket_id = 'marketing' and public.mi_rol() in ('admin', 'marketing'));
create policy marketing_borrar on storage.objects for delete
  using (bucket_id = 'marketing' and public.mi_rol() in ('admin', 'marketing'));
