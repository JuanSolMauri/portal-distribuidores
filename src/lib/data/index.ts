import "server-only";
import { cookies } from "next/headers";
import { modoDemo } from "@/lib/config";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Categoria, Contexto, Marca, Material, Rol } from "@/lib/types";
import * as demo from "./demo";

export const COOKIE_DEMO = "demo_usuario";

/** Devuelve el usuario que ha entrado y sus marcas, o null si no hay sesión. */
export async function obtenerContexto(): Promise<Contexto | null> {
  if (modoDemo) {
    const almacen = await cookies();
    return demo.contextoDemo(almacen.get(COOKIE_DEMO)?.value);
  }

  const supabase = await crearClienteServidor();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("id, nombre, rol, distribuidores(id, nombre, pais)")
    .eq("id", auth.user.id)
    .single();
  if (!perfil) return null;

  // RLS ya devuelve solo las marcas que este usuario puede ver.
  const { data: marcas } = await supabase.from("marcas").select("id, slug, nombre").order("nombre");

  const dist = perfil.distribuidores as unknown as { id: string; nombre: string; pais: string } | null;
  return {
    modo: "supabase",
    usuario: { id: perfil.id, nombre: perfil.nombre, rol: perfil.rol as Rol },
    distribuidor: dist,
    marcas: (marcas ?? []) as Marca[],
  };
}

export async function listarCategorias(): Promise<Categoria[]> {
  if (modoDemo) return demo.categorias;
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("categorias_marketing").select("slug, nombre, orden").order("orden");
  return (data ?? []) as Categoria[];
}

export async function listarMateriales(ctx: Contexto, filtro: { marca?: string; categoria?: string } = {}): Promise<Material[]> {
  const permitidas = new Set(ctx.marcas.map((m) => m.id));
  const marcaId = filtro.marca ? ctx.marcas.find((m) => m.slug === filtro.marca)?.id : undefined;
  if (filtro.marca && !marcaId) return []; // marca no autorizada o inexistente

  let lista: Material[];
  if (modoDemo) {
    lista = demo.materiales;
  } else {
    const supabase = await crearClienteServidor();
    let consulta = supabase
      .from("materiales")
      .select("id, marca_id, categoria, titulo, ruta_archivo, mime, tamano_bytes, publicado_en")
      .order("publicado_en", { ascending: false });
    if (marcaId) consulta = consulta.eq("marca_id", marcaId);
    if (filtro.categoria) consulta = consulta.eq("categoria", filtro.categoria);
    const { data } = await consulta;
    lista = (data ?? []).map((r) => ({
      id: r.id,
      marcaId: r.marca_id,
      categoria: r.categoria,
      titulo: r.titulo,
      rutaArchivo: r.ruta_archivo,
      mime: r.mime,
      tamanoBytes: r.tamano_bytes,
      publicadoEn: r.publicado_en,
    }));
  }

  // Segunda barrera además de RLS: nunca mostrar una marca no autorizada.
  return lista
    .filter((m) => permitidas.has(m.marcaId))
    .filter((m) => !marcaId || m.marcaId === marcaId)
    .filter((m) => !filtro.categoria || m.categoria === filtro.categoria)
    .sort((a, b) => b.publicadoEn.localeCompare(a.publicadoEn));
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
