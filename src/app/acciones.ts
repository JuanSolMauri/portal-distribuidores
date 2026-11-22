"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { modoDemo } from "@/lib/config";
import { COOKIE_DEMO } from "@/lib/data";
import { usuariosDemo } from "@/lib/data/demo";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function entrar(_prev: { error?: string } | undefined, form: FormData) {
  if (modoDemo) redirect("/inicio");
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Escribe tu email y tu contraseña." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email o contraseña incorrectos." };
  redirect("/inicio");
}

export async function salir() {
  if (!modoDemo) {
    const supabase = await crearClienteServidor();
    await supabase.auth.signOut();
  }
  redirect("/login");
}

/** Solo en modo demo: cambia el usuario de ejemplo para ver otras marcas. */
export async function cambiarUsuarioDemo(form: FormData) {
  if (!modoDemo) return;
  const clave = String(form.get("usuario") ?? "");
  if (!(clave in usuariosDemo)) return;
  const almacen = await cookies();
  almacen.set(COOKIE_DEMO, clave, { path: "/", sameSite: "lax", httpOnly: true });
  redirect(String(form.get("volver") ?? "/inicio"));
}
