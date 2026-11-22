-- Datos iniciales: marcas y categorías de Marketing (las carpetas de Drive "Internacional").

insert into public.marcas (slug, nombre) values
  ('sergio-tacchini', 'Sergio Tacchini'),
  ('house-of-helios', 'House of Helios')
on conflict (slug) do nothing;

insert into public.categorias_marketing (slug, nombre, orden) values
  ('presentacion', 'Presentación', 1),
  ('lista-de-precios', 'Lista de precios', 2),
  ('fotos-del-producto', 'Fotos del producto', 3),
  ('logotipos', 'Logotipos', 4),
  ('videos-de-presentacion', 'Vídeos de presentación', 5),
  ('material-plv', 'Material PLV', 6),
  ('business-plan', 'Business Plan', 7),
  ('forecast', 'Forecast', 8)
on conflict (slug) do update set nombre = excluded.nombre, orden = excluded.orden;
