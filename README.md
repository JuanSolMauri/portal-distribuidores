# Portal de distribuidores

Portal web privado para los distribuidores internacionales. Cada distribuidor entra con su usuario y solo ve las marcas que tiene autorizadas.

Pestañas: Inicio, Marketing, Business Plan, Pedidos, Contrato, Documentación y Contacto.

## Estado

| Parte | Estado |
| --- | --- |
| Base de la web, diseño y pestañas | Hecho |
| Base de datos con permisos por marca (Supabase, RLS) | Hecho |
| Inicio y Marketing (filtros por marca y tipo, descargas con enlace temporal) | Hecho |
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
2. En el editor SQL ejecuta `supabase/migrations/0001_esquema_base.sql` y después `supabase/seed.sql`.
3. Copia `.env.example` a `.env.local` y rellena la URL y la clave `anon` del proyecto.
4. Crea los usuarios en Authentication y su fila en `perfiles` con el rol y el distribuidor.

## Cómo funcionan los permisos

- Roles internos: `admin`, `gestor`, `marketing`. Roles del distribuidor: `dist_admin`, `dist_usuario`.
- `distribuidor_marca` dice qué marcas lleva cada distribuidor, con fechas de vigencia.
- Las políticas RLS de la base de datos filtran marcas, materiales y archivos: aunque la web tuviera un fallo, la base de datos no devuelve datos de otra marca.
- Los archivos están en un bucket privado (`marketing`, ruta `<marca>/<categoría>/<archivo>`) y se descargan con enlaces que caducan en 5 minutos.
