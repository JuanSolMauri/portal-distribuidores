-- Datos iniciales: marcas y categorías (las carpetas de Drive "Internacional").

insert into public.marcas (slug, nombre) values
  ('sergio-tacchini', 'Sergio Tacchini'),
  ('house-of-helios', 'House of Helios'),
  ('olevi', 'Olevi')
on conflict (slug) do nothing;

insert into public.categorias_marketing (slug, nombre, ambito, orden) values
  -- Comun/<Marca>/...
  ('presentacion', 'Presentación', 'comun', 1),
  ('fotos-del-producto', 'Fotos del producto', 'comun', 2),
  ('logotipos', 'Logotipos', 'comun', 3),
  ('videos-de-presentacion', 'Vídeos de presentación', 'comun', 4),
  ('material-plv', 'Material PLV', 'comun', 5),
  -- Clientes/<Cliente>/...
  ('lista-de-precios', 'Lista de precios', 'cliente', 10),
  ('contrato', 'Contrato', 'cliente', 11),
  ('business-plan', 'Business Plan', 'cliente', 12),
  ('forecast', 'Forecast', 'cliente', 13)
on conflict (slug) do update set nombre = excluded.nombre, ambito = excluded.ambito, orden = excluded.orden;
