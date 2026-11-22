export type Rol = "admin" | "gestor" | "marketing" | "dist_admin" | "dist_usuario";

export interface Marca {
  id: string;
  slug: string;
  nombre: string;
}

export interface Distribuidor {
  id: string;
  nombre: string;
  pais: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
}

export interface Categoria {
  slug: string;
  nombre: string;
  orden: number;
}

export interface Material {
  id: string;
  marcaId: string;
  categoria: string;
  titulo: string;
  rutaArchivo: string;
  mime: string | null;
  tamanoBytes: number | null;
  publicadoEn: string;
}

/** Todo lo que la interfaz necesita saber del usuario que ha entrado. */
export interface Contexto {
  modo: "demo" | "supabase";
  usuario: Usuario;
  distribuidor: Distribuidor | null;
  /** Solo las marcas que este usuario puede ver. */
  marcas: Marca[];
}

export const esInterno = (rol: Rol) => rol === "admin" || rol === "gestor" || rol === "marketing";
