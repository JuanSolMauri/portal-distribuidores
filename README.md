# Portal de distribuidores

Portal web privado para los distribuidores internacionales. Cada distribuidor entra con su usuario y solo ve las marcas que tiene autorizadas.

Pestañas: Inicio, Marketing, Mis documentos, Business Plan, Pedidos, Contrato, Documentación y Contacto.

## Carpetas

Igual que la carpeta "Internacional" de Drive:

```
Internacional/
├── Comun/<Marca>/<Categoría>     → Marketing: lo ven todos los clientes con esa marca
└── Clientes/<Cliente>/<Categoría> → Mis documentos: solo lo ve ese cliente
```

- Categorías comunes: Presentación, Fotos del producto, Logotipos, Vídeos de presentación, Material PLV.
- Categorías de cliente: Lista de precios, Contrato, Business Plan, Forecast.

## Estado

| Parte | Estado |
| --- | --- |
| Base de la web, diseño y pestañas | Hecho |
| Base de datos con permisos por marca (Supabase, RLS) | Hecho |
| Inicio, Marketing (común por marca) y Mis documentos (carpeta del cliente) | Hecho |
| Business Plan, Pedidos, Contrato, Documentación, Contacto | Próximamente |
| Carga de materiales desde Google Drive | Próximamente |

## Probarlo en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000. Sin variables de entorno arranca en **modo demo**: sin login, con datos de ejemplo y un selector arriba para ver el portal como distintos distribuidores (con 2 marcas, solo Sergio Tacchini o solo House of Helios).

## Conectarlo a Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (región UE).
2. En el editor SQL ejecuta, en orden, los archivos de `supabase/migrations/` y después `supabase/seed.sql`.
3. Copia `.env.example` a `.env.local` y rellena la URL y la clave `anon` del proyecto.
4. Crea el primer usuario administrador en Authentication y su fila en `perfiles` con rol `admin`.
5. A partir de ahí, todo se hace desde la pestaña **Administración** del portal (solo la ve el equipo interno):
   - **Archivos:** subir archivos a una carpeta común de marca o a la carpeta privada de un cliente, y borrarlos. Se suben directamente del navegador a Supabase (máximo 50 MB por archivo en el plan gratuito).
   - **Clientes y usuarios:** crear clientes, elegir sus marcas y dar acceso a personas. El usuario se crea antes en Supabase (Authentication → Users → Add user) y después se le asigna cliente y tipo con «Dar acceso».

## Cómo funcionan los permisos

- Roles internos: `admin`, `gestor`, `marketing`. Roles del distribuidor: `dist_admin`, `dist_usuario`.
- `distribuidor_marca` dice qué marcas lleva cada distribuidor, con fechas de vigencia.
- Las políticas RLS de la base de datos filtran marcas, materiales y archivos: aunque la web tuviera un fallo, la base de datos no devuelve datos de otra marca.
- Un material de la carpeta de un cliente (`distribuidor_id` relleno) solo lo ve ese cliente. Un material común lo ven los clientes que tienen su marca.
- Los archivos están en un bucket privado (`marketing`, rutas `comun/<marca>/<categoría>/<archivo>` y `clientes/<id-cliente>/<categoría>/<archivo>`) y se descargan con enlaces que caducan en 5 minutos.
