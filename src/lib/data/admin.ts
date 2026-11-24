import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import type { Rol } from "@/lib/types";

export interface ClienteAdmin {
  id: string;
  nombre: string;
  pais: string;
  activo: boolean;
  marcaIds: string[];
}

export interface UsuarioAdmin {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  distribuidorId: string | null;
}

export async function listarClientes(): Promise<ClienteAdmin[]> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase
    .from("distribuidores")
    .select("id, nombre, pais, activo, distribuidor_marca(marca_id, activa)")
    .order("nombre");
  if (error) console.error("[admin] clientes", error);
  return (data ?? []).map((d) => ({
    id: d.id,
    nombre: d.nombre,
    pais: d.pais,
    activo: d.activo,
    marcaIds: ((d.distribuidor_marca ?? []) as { marca_id: string; activa: boolean }[])
      .filter((x) => x.activa)
      .map((x) => x.marca_id),
  }));
}

export async function listarUsuarios(): Promise<{ usuarios: UsuarioAdmin[]; error?: string }> {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("listar_usuarios");
  if (error) return { usuarios: [], error: error.message };
  return {
    usuarios: (data ?? []).map((u: { id: string; email: string; nombre: string; rol: Rol; distribuidor_id: string | null }) => ({
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      rol: u.rol,
      distribuidorId: u.distribuidor_id,
    })),
  };
}
