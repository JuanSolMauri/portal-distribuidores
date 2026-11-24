import "server-only";
import { cookies } from "next/headers";
import { modoDemo } from "@/lib/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import { esInterno, type Ambito, type Categoria, type Contexto, type Marca, type Material, type Rol } from "@/lib/types";
import * as demo from "./demo";

export const COOKIE_DEMO = "demo_usuario";

export type MotivoSinAcceso = "sin-sesion" | "sin-perfil" | "error";

/** Devuelve el usuario que ha entrado y sus marcas, o el motivo por el que no puede entrar. */
export async function obtenerAcceso(): Promise<{ ctx: Contexto } | { motivo: MotivoSinAcceso; detalle?: string }> {
  if (modoDemo) {
    const almacen = await cookies();
    return { ctx: demo.contextoDemo(almacen.get(COOKIE_DEMO)?.value) };
  }

  const supabase = await crearClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { motivo: "sin-sesion" };

  const { data: perfil, error } = await supabase
    .from("perfiles")
    .select("id, nombre, rol, distribuidores(id, nombre, pais)")
    .eq("id", auth.user.id)
    .maybeSingle();
  if (error) {
    console.error("[acceso] error leyendo perfil", error);
    return { motivo: "error", detalle: `${error.code ?? ""} ${error.message}`.trim() };
  }
  if (!perfil) return { motivo: "sin-perfil", detalle: auth.user.email ?? undefined };

  // RLS ya devuelve solo las marcas que este usuario puede ver.
  const { data: marcas, error: errorMarcas } = await supabase.from("marcas").select("id, slug, nombre").order("nombre");
  if (errorMarcas) console.error("[acceso] error leyendo marcas", errorMarcas);

  const dist = perfil.distribuidores as unknown as { id: string; nombre: string; pais: string } | null;
  return {
    ctx: {
      modo: "supabase",
      usuario: { id: perfil.id, nombre: perfil.nombre, rol: perfil.rol as Rol },
      distribuidor: dist,
      marcas: (marcas ?? []) as Marca[],
    },
  };
}

/** Atajo para páginas: el contexto, o null si no hay acceso. */
export async function obtenerContexto(): Promise<Contexto | null> {
  const r = await obtenerAcceso();
  return "ctx" in r ? r.ctx : null;
}

export async function listarCategorias(ambito?: Ambito): Promise<Categoria[]> {
  let lista: Categoria[];
  if (modoDemo) {
    lista = demo.categorias;
  } else {
    const supabase = await crearClienteServidor();
    const { data } = await supabase.from("categorias_marketing").select("slug, nombre, ambito, orden").order("orden");
    lista = (data ?? []) as Categoria[];
  }
  return ambito ? lista.filter((c) => c.ambito === ambito) : lista;
}

/** Misma regla que puede_ver_material() en la base de datos, como segunda barrera. */
function puedeVer(ctx: Contexto, m: Material): boolean {
  if (esInterno(ctx.usuario.rol)) return true;
  const permitidas = new Set(ctx.marcas.map((x) => x.id));
  if (m.distribuidorId == null) return m.marcaId != null && permitidas.has(m.marcaId);
  return m.distribuidorId === ctx.distribuidor?.id && (m.marcaId == null || permitidas.has(m.marcaId));
}

interface Filtro {
  /** comun = carpetas comunes por marca; cliente = la carpeta propia del cliente. */
  ambito?: Ambito;
  marca?: string;
  categoria?: string;
}

export async function listarMateriales(ctx: Contexto, filtro: Filtro = {}): Promise<Material[]> {
  const marcaId = filtro.marca ? ctx.marcas.find((m) => m.slug === filtro.marca)?.id : undefined;
  if (filtro.marca && !marcaId) return []; // marca no autorizada o inexistente

  let lista: Material[];
  if (modoDemo) {
    lista = demo.materiales;
  } else {
    const supabase = await crearClienteServidor();
    let consulta = supabase
      .from("materiales")
      .select("id, marca_id, distribuidor_id, categoria, titulo, ruta_archivo, mime, tamano_bytes, publicado_en")
      .order("publicado_en", { ascending: false });
    if (filtro.ambito === "comun") consulta = consulta.is("distribuidor_id", null);
    if (filtro.ambito === "cliente") consulta = consulta.not("distribuidor_id", "is", null);
    if (marcaId) consulta = consulta.eq("marca_id", marcaId);
    if (filtro.categoria) consulta = consulta.eq("categoria", filtro.categoria);
    const { data } = await consulta;
    lista = (data ?? []).map((r) => ({
      id: r.id,
      marcaId: r.marca_id,
      distribuidorId: r.distribuidor_id,
      categoria: r.categoria,
      titulo: r.titulo,
      rutaArchivo: r.ruta_archivo,
      mime: r.mime,
      tamanoBytes: r.tamano_bytes,
      publicadoEn: r.publicado_en,
    }));
  }

  return lista
    .filter((m) => puedeVer(ctx, m))
    .filter((m) => filtro.ambito !== "comun" || m.distribuidorId == null)
    .filter((m) => filtro.ambito !== "cliente" || m.distribuidorId != null)
    .filter((m) => !marcaId || m.marcaId === marcaId)
    .filter((m) => !filtro.categoria || m.categoria === filtro.categoria)
    .sort((a, b) => b.publicadoEn.localeCompare(a.publicadoEn));
}

export type ResultadoVer =
  | { material: Material; url: string | null }
  | { error: "no-encontrado" | "fallo" };

/**
 * Para ver un archivo dentro del portal: el material y un enlace sin descarga forzada.
 * Dura 1 hora para que un vídeo largo no se corte. RLS decide si el usuario puede.
 * En modo demo no hay archivo: url = null.
 */
export async function enlaceVer(ctx: Contexto, materialId: string): Promise<ResultadoVer> {
  if (modoDemo) {
    const material = (await listarMateriales(ctx)).find((m) => m.id === materialId);
    return material ? { material, url: null } : { error: "no-encontrado" };
  }

  const supabase = await crearClienteServidor();
  const { data: r } = await supabase
    .from("materiales")
    .select("id, marca_id, distribuidor_id, categoria, titulo, ruta_archivo, mime, tamano_bytes, publicado_en")
    .eq("id", materialId)
    .maybeSingle();
  if (!r) return { error: "no-encontrado" };
  const material: Material = {
    id: r.id,
    marcaId: r.marca_id,
    distribuidorId: r.distribuidor_id,
    categoria: r.categoria,
    titulo: r.titulo,
    rutaArchivo: r.ruta_archivo,
    mime: r.mime,
    tamanoBytes: r.tamano_bytes,
    publicadoEn: r.publicado_en,
  };
  if (!puedeVer(ctx, material)) return { error: "no-encontrado" };

  const { data, error } = await supabase.storage.from("marketing").createSignedUrl(material.rutaArchivo, 3600);
  if (error || !data) return { error: "fallo" };
  return { material, url: data.signedUrl };
}

export type ResultadoDescarga = { url: string } | { error: "no-encontrado" | "demo" | "fallo" };

/** Genera un enlace de descarga que caduca en 5 minutos. RLS decide si el usuario puede. */
export async function enlaceDescarga(ctx: Contexto, materialId: string): Promise<ResultadoDescarga> {
  if (modoDemo) {
    const existe = (await listarMateriales(ctx)).some((m) => m.id === materialId);
    return { error: existe ? "demo" : "no-encontrado" };
  }

  const supabase = await crearClienteServidor();
  const { data: material } = await supabase
    .from("materiales")
    .select("id, ruta_archivo")
    .eq("id", materialId)
    .maybeSingle();
  if (!material) return { error: "no-encontrado" };

  const nombre = material.ruta_archivo.split("/").pop() ?? "archivo";
  const { data, error } = await supabase.storage
    .from("marketing")
    .createSignedUrl(material.ruta_archivo, 300, { download: nombre });
  if (error || !data) return { error: "fallo" };

  await supabase.from("descargas").insert({ material_id: material.id, usuario_id: ctx.usuario.id });
  return { url: data.signedUrl };
}
