"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { modoDemo } from "@/lib/config";
import { obtenerContexto } from "@/lib/data";
import { crearClienteServidor } from "@/lib/supabase/server";
import { esInterno, type Rol } from "@/lib/types";

/** Vuelve a la página con un mensaje de resultado. */
function volver(ruta: string, tipo: "ok" | "error", texto: string): never {
  redirect(`${ruta}?${new URLSearchParams({ [tipo]: texto })}`);
}

async function exigirInterno(ruta: string) {
  if (modoDemo) volver(ruta, "error", "En modo demo no se pueden guardar cambios.");
  const ctx = await obtenerContexto();
  if (!ctx || !esInterno(ctx.usuario.rol)) redirect("/inicio");
  return crearClienteServidor();
}

const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "").trim();

// ---------------------------------------------------------------------------
// Archivos
// ---------------------------------------------------------------------------

export async function borrarMaterial(form: FormData) {
  const ruta = "/admin/archivos";
  const supabase = await exigirInterno(ruta);
  const id = texto(form, "id");
  const { data: m } = await supabase.from("materiales").select("id, ruta_archivo, titulo").eq("id", id).maybeSingle();
  if (!m) volver(ruta, "error", "Ese archivo ya no existe.");

  const { error: errorArchivo } = await supabase.storage.from("marketing").remove([m.ruta_archivo]);
  if (errorArchivo) volver(ruta, "error", `No se pudo borrar el archivo: ${errorArchivo.message}`);
  const { error } = await supabase.from("materiales").delete().eq("id", id);
  if (error) volver(ruta, "error", `No se pudo borrar: ${error.message}`);

  revalidatePath("/", "layout");
  volver(ruta, "ok", `Borrado: ${m.titulo}`);
}

// ---------------------------------------------------------------------------
// Clientes
// ---------------------------------------------------------------------------

async function guardarMarcas(supabase: Awaited<ReturnType<typeof crearClienteServidor>>, distribuidorId: string, marcaIds: string[]) {
  const { error: e1 } = await supabase.from("distribuidor_marca").delete().eq("distribuidor_id", distribuidorId);
  if (e1) return e1.message;
  if (marcaIds.length === 0) return null;
  const { error: e2 } = await supabase
    .from("distribuidor_marca")
    .insert(marcaIds.map((marca_id) => ({ distribuidor_id: distribuidorId, marca_id })));
  return e2?.message ?? null;
}

export async function crearCliente(form: FormData) {
  const ruta = "/admin/clientes";
  const supabase = await exigirInterno(ruta);
  const nombre = texto(form, "nombre");
  const pais = texto(form, "pais");
  if (!nombre || !pais) volver(ruta, "error", "Escribe el nombre y el país del cliente.");

  const { data, error } = await supabase.from("distribuidores").insert({ nombre, pais }).select("id").single();
  if (error || !data) volver(ruta, "error", `No se pudo crear el cliente: ${error?.message}`);

  const fallo = await guardarMarcas(supabase, data.id, form.getAll("marcas").map(String));
  if (fallo) volver(ruta, "error", `Cliente creado, pero no se guardaron sus marcas: ${fallo}`);

  revalidatePath("/", "layout");
  volver(ruta, "ok", `Cliente creado: ${nombre}`);
}

export async function actualizarCliente(form: FormData) {
  const ruta = "/admin/clientes";
  const supabase = await exigirInterno(ruta);
  const id = texto(form, "id");
  const nombre = texto(form, "nombre");
  const pais = texto(form, "pais");
  if (!nombre || !pais) volver(ruta, "error", "El cliente necesita nombre y país.");

  const { error } = await supabase
    .from("distribuidores")
    .update({ nombre, pais, activo: form.get("activo") === "on" })
    .eq("id", id);
  if (error) volver(ruta, "error", `No se pudo guardar: ${error.message}`);

  const fallo = await guardarMarcas(supabase, id, form.getAll("marcas").map(String));
  if (fallo) volver(ruta, "error", `No se guardaron las marcas: ${fallo}`);

  revalidatePath("/", "layout");
  volver(ruta, "ok", `Guardado: ${nombre}`);
}

// ---------------------------------------------------------------------------
// Usuarios
// ---------------------------------------------------------------------------

const ROLES: Rol[] = ["admin", "gestor", "marketing", "dist_admin", "dist_usuario"];

export async function darAcceso(form: FormData) {
  const ruta = "/admin/clientes";
  const supabase = await exigirInterno(ruta);
  const email = texto(form, "email");
  const nombre = texto(form, "nombre");
  const rol = texto(form, "rol") as Rol;
  const distribuidor = texto(form, "distribuidor") || null;
  if (!email || !nombre) volver(ruta, "error", "Escribe el email y el nombre de la persona.");
  if (!ROLES.includes(rol)) volver(ruta, "error", "Elige un tipo de usuario.");
  if (!esInterno(rol) && !distribuidor) volver(ruta, "error", "Elige a qué cliente pertenece.");

  const { error } = await supabase.rpc("dar_acceso", {
    p_email: email,
    p_nombre: nombre,
    p_rol: rol,
    p_distribuidor: esInterno(rol) ? null : distribuidor,
  });
  if (error) volver(ruta, "error", error.message);

  revalidatePath("/", "layout");
  volver(ruta, "ok", `Acceso dado a ${email}`);
}

/** Borra un cliente, sus marcas y sus archivos privados. No deja si aún tiene personas con acceso. */
export async function borrarCliente(form: FormData) {
  const ruta = "/admin/clientes";
  const supabase = await exigirInterno(ruta);
  const id = texto(form, "id");
  const { data: cliente } = await supabase.from("distribuidores").select("id, nombre").eq("id", id).maybeSingle();
  if (!cliente) volver(ruta, "error", "Ese cliente ya no existe.");

  const { count } = await supabase.from("perfiles").select("id", { count: "exact", head: true }).eq("distribuidor_id", id);
  if (count) volver(ruta, "error", `${cliente.nombre} todavía tiene ${count} persona(s) con acceso. Quítales el acceso primero.`);

  const { data: archivos } = await supabase.from("materiales").select("ruta_archivo").eq("distribuidor_id", id);
  if (archivos?.length) {
    const { error } = await supabase.storage.from("marketing").remove(archivos.map((a) => a.ruta_archivo));
    if (error) volver(ruta, "error", `No se pudieron borrar sus archivos: ${error.message}`);
  }
  const { error } = await supabase.from("distribuidores").delete().eq("id", id);
  if (error) volver(ruta, "error", `No se pudo borrar el cliente: ${error.message}`);

  revalidatePath("/", "layout");
  volver(ruta, "ok", `Cliente borrado: ${cliente.nombre}`);
}

/** Quita el acceso al portal (borra su perfil). El usuario de Supabase sigue existiendo, pero no ve nada. */
export async function quitarAcceso(form: FormData) {
  const ruta = "/admin/clientes";
  const supabase = await exigirInterno(ruta);
  const id = texto(form, "id");
  const ctx = await obtenerContexto();
  if (ctx?.usuario.id === id) volver(ruta, "error", "No puedes quitarte el acceso a ti mismo.");

  const { data, error } = await supabase.from("perfiles").delete().eq("id", id).select("nombre");
  if (error) volver(ruta, "error", `No se pudo quitar el acceso: ${error.message}`);
  if (!data?.length) volver(ruta, "error", "No se pudo quitar el acceso: solo un administrador puede hacerlo.");

  revalidatePath("/", "layout");
  volver(ruta, "ok", `Acceso quitado a ${data[0].nombre}`);
}
