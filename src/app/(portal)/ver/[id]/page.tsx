import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { enlaceVer, listarCategorias, obtenerContexto } from "@/lib/data";
import { decodificar, formatoTamano, tipoArchivo, tipoVista } from "@/lib/formato";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ volver?: string }> };

/** Solo se vuelve a páginas del propio portal. */
const RUTAS_VOLVER = ["/marketing", "/mis-documentos", "/inicio", "/admin/archivos"];

/** Ver un archivo dentro del portal antes de descargarlo. */
export default async function Ver({ params, searchParams }: Props) {
  const ctx = await obtenerContexto();
  if (!ctx) redirect("/login");
  const { id: crudo } = await params;
  const id = decodificar(crudo);
  const { volver: v } = await searchParams;
  const volver = RUTAS_VOLVER.find((r) => v?.split("?")[0] === r) ? v! : "/marketing";

  const r = await enlaceVer(ctx, id);
  if ("error" in r) {
    if (r.error === "no-encontrado") notFound();
    return <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">No se pudo abrir el archivo. Inténtalo de nuevo en un momento.</p>;
  }
  const { material: m, url } = r;
  const vista = tipoVista(m.mime, m.rutaArchivo);
  const categorias = await listarCategorias();
  const marca = ctx.marcas.find((x) => x.id === m.marcaId)?.nombre;
  const categoria = categorias.find((c) => c.slug === m.categoria)?.nombre ?? m.categoria;
  const descargar = `/api/descargar/${encodeURIComponent(m.id)}?volver=${encodeURIComponent(volver)}`;

  return (
    <div className="flex flex-col gap-4">
      <Link href={volver} className="self-start text-sm">← Volver</Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-xl font-semibold break-words">{m.titulo}</h1>
          <span className="text-sm text-suave">
            {[marca, categoria, tipoArchivo(m.mime, m.rutaArchivo), formatoTamano(m.tamanoBytes)].filter(Boolean).join(" · ")}
          </span>
        </div>
        <div className="flex gap-2">
          {url && vista && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="flex min-h-10 items-center rounded-lg border border-acento px-4 font-semibold no-underline">
              Pantalla completa
            </a>
          )}
          <a href={descargar} className="flex min-h-10 items-center rounded-lg bg-acento px-4 font-semibold text-white no-underline hover:bg-acento-oscuro hover:text-white">
            Descargar
          </a>
        </div>
      </div>

      {!url ? (
        <p role="status" className="rounded-lg bg-amber-50 p-3 text-amber-900">
          En modo demo no hay archivos reales. Con Supabase conectado, aquí se ve el archivo.
        </p>
      ) : vista === "pdf" ? (
        <iframe src={url} title={m.titulo} className="h-[80vh] w-full rounded-xl border border-borde bg-white" />
      ) : vista === "imagen" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={m.titulo} className="max-h-[80vh] w-full rounded-xl border border-borde bg-white object-contain" />
      ) : vista === "video" ? (
        <video src={url} controls playsInline className="max-h-[80vh] w-full rounded-xl bg-black" />
      ) : (
        <div className="rounded-xl border border-dashed border-[#c5ced8] bg-white p-8 text-center text-suave">
          Este tipo de archivo ({tipoArchivo(m.mime, m.rutaArchivo)}) no se puede ver en el navegador. Descárgalo para abrirlo.
        </div>
      )}
    </div>
  );
}
