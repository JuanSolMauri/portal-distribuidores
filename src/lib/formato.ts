export function formatoTamano(bytes: number | null): string {
  if (bytes == null) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toLocaleString("es-ES", { maximumFractionDigits: 1 })} MB`;
}

export function tipoArchivo(mime: string | null, ruta: string): string {
  const ext = ruta.split(".").pop()?.toLowerCase() ?? "";
  if (mime === "application/pdf" || ext === "pdf") return "PDF";
  if (ext === "xlsx" || ext === "xls") return "Excel";
  if (mime?.startsWith("image/")) return "Imagen";
  if (mime?.startsWith("video/")) return "Vídeo";
  if (ext === "zip") return "ZIP";
  return ext.toUpperCase() || "Archivo";
}

export type TipoVista = "pdf" | "imagen" | "video";

/** Si el navegador puede mostrar el archivo dentro del portal, y cómo. */
export function tipoVista(mime: string | null, ruta: string): TipoVista | null {
  const ext = ruta.split(".").pop()?.toLowerCase() ?? "";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime?.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) return "imagen";
  if (mime?.startsWith("video/") || ["mp4", "webm", "mov", "m4v"].includes(ext)) return "video";
  return null;
}

/** Los ids del modo demo llevan espacios; los de Supabase son uuid y no cambian. */
export function decodificar(valor: string): string {
  try {
    return decodeURIComponent(valor);
  } catch {
    return valor;
  }
}
