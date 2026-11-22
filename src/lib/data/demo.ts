import type { Categoria, Contexto, Distribuidor, Marca, Material, Usuario } from "@/lib/types";

/**
 * Datos del modo demo. Las marcas, categorías y nombres de archivo son los de la
 * carpeta "Internacional" de Drive; los distribuidores y usuarios son ficticios.
 * En modo demo no hay archivos reales: la descarga muestra un aviso.
 */

export const marcas: Marca[] = [
  { id: "m-st", slug: "sergio-tacchini", nombre: "Sergio Tacchini" },
  { id: "m-hoh", slug: "house-of-helios", nombre: "House of Helios" },
];

export const categorias: Categoria[] = [
  { slug: "presentacion", nombre: "Presentación", orden: 1 },
  { slug: "lista-de-precios", nombre: "Lista de precios", orden: 2 },
  { slug: "fotos-del-producto", nombre: "Fotos del producto", orden: 3 },
  { slug: "logotipos", nombre: "Logotipos", orden: 4 },
  { slug: "videos-de-presentacion", nombre: "Vídeos de presentación", orden: 5 },
  { slug: "material-plv", nombre: "Material PLV", orden: 6 },
  { slug: "business-plan", nombre: "Business Plan", orden: 7 },
  { slug: "forecast", nombre: "Forecast", orden: 8 },
];

const st = (categoria: string, archivo: string, tamanoBytes: number, mime: string, fecha: string): Material => ({
  id: `st-${archivo}`,
  marcaId: "m-st",
  categoria,
  titulo: archivo.replace(/\.[a-z]+$/i, ""),
  rutaArchivo: `sergio-tacchini/${categoria}/${archivo}`,
  mime,
  tamanoBytes,
  publicadoEn: fecha,
});

const PDF = "application/pdf";
const XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const materiales: Material[] = [
  st("presentacion", "1-PRESENTATION_SERGIO TACCHINI_TIME SET_2026-sm ENG.pdf", 2533034, PDF, "2026-11-01"),
  st("presentacion", "Tacchini Ocean Club-Splendida-sm.pdf", 3495816, PDF, "2025-11-22"),
  st("presentacion", "Tacchini Club-Your Match-sm.pdf", 1877952, PDF, "2025-11-22"),
  st("presentacion", "Tacchini Pacific Blue-Pure Black-sm.pdf", 1483761, PDF, "2025-11-22"),
  st("lista-de-precios", "Export Price List EU 2026_ST 26-11-16.xlsx", 5262982, XLSX, "2026-11-16"),
  st("lista-de-precios", "Order Form EU_ST.xlsx", 5204783, XLSX, "2026-09-04"),
  st("lista-de-precios", "Export Price List RU 2026_ST.xlsx", 5197364, XLSX, "2026-07-24"),
];

interface UsuarioDemo {
  usuario: Usuario;
  distribuidor: Distribuidor | null;
  marcaIds: string[];
}

/** Usuarios de ejemplo para ver cómo cambia el portal según las marcas autorizadas. */
export const usuariosDemo: Record<string, UsuarioDemo> = {
  "dist-ambas": {
    usuario: { id: "u1", nombre: "Ana (distribuidor con 2 marcas)", rol: "dist_admin" },
    distribuidor: { id: "d1", nombre: "Distribuidor Demo México", pais: "México" },
    marcaIds: ["m-st", "m-hoh"],
  },
  "dist-tacchini": {
    usuario: { id: "u2", nombre: "Marc (solo Sergio Tacchini)", rol: "dist_usuario" },
    distribuidor: { id: "d2", nombre: "Distribuidor Demo Chile", pais: "Chile" },
    marcaIds: ["m-st"],
  },
  "dist-helios": {
    usuario: { id: "u3", nombre: "Lucía (solo House of Helios)", rol: "dist_usuario" },
    distribuidor: { id: "d3", nombre: "Distribuidor Demo Brasil", pais: "Brasil" },
    marcaIds: ["m-hoh"],
  },
  interno: {
    usuario: { id: "u0", nombre: "Equipo interno", rol: "admin" },
    distribuidor: null,
    marcaIds: marcas.map((m) => m.id),
  },
};

export const usuarioDemoPorDefecto = "dist-ambas";

export function contextoDemo(clave: string | undefined): Contexto {
  const u = usuariosDemo[clave ?? ""] ?? usuariosDemo[usuarioDemoPorDefecto];
  return {
    modo: "demo",
    usuario: u.usuario,
    distribuidor: u.distribuidor,
    marcas: marcas.filter((m) => u.marcaIds.includes(m.id)),
  };
}
