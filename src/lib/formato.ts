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
