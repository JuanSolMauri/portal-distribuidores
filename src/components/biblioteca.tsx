import Link from "next/link";
import { listarCategorias, listarMateriales } from "@/lib/data";
import { formatoTamano, tipoArchivo } from "@/lib/formato";
import type { Ambito, Contexto } from "@/lib/types";

interface Props {
  ctx: Contexto;
  ambito: Ambito;
  /** Ruta de la página, para construir los filtros. */
  ruta: string;
  titulo: string;
  descripcion: string;
  marca?: string;
  categoria?: string;
  aviso?: string;
  /** Mostrar el filtro de marca (en la carpeta de cliente casi nunca hace falta). */
  filtroMarca: boolean;
}

const chip = (activo: boolean) =>
  `inline-flex min-h-9 items-center rounded-full border px-3.5 text-[13px] no-underline ${
    activo ? "border-acento bg-acento font-semibold text-white hover:text-white" : "border-[#c5ced8] bg-white text-tinta"
  }`;

/** Lista de materiales con filtros por marca y categoría y botón de descarga. */
export async function Biblioteca({ ctx, ambito, ruta, titulo, descripcion, marca, categoria, aviso, filtroMarca }: Props) {
  const enlace = (m?: string, c?: string) => {
    const q = new URLSearchParams();
    if (m) q.set("marca", m);
    if (c) q.set("categoria", c);
    const s = q.toString();
    return s ? `${ruta}?${s}` : ruta;
  };

  const [categorias, todos] = await Promise.all([listarCategorias(ambito), listarMateriales(ctx, { ambito, marca })]);
  const materiales = categoria ? todos.filter((m) => m.categoria === categoria) : todos;
  const nombreMarca = new Map(ctx.marcas.map((m) => [m.id, m.nombre]));
  const nombreCategoria = new Map(categorias.map((c) => [c.slug, c.nombre]));
  const cuenta = (slug: string) => todos.filter((m) => m.categoria === slug).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{titulo}</h1>
        <p className="text-suave">{descripcion}</p>
      </div>

      {aviso === "demo" && (
        <p role="status" className="rounded-lg bg-amber-50 p-3 text-amber-900">
          En modo demo no hay archivos reales. Con Supabase conectado, este botón descarga el archivo con un enlace que caduca en 5 minutos.
        </p>
      )}

      {filtroMarca && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-suave">Marca</span>
          <div className="flex flex-wrap gap-2">
            <Link href={enlace(undefined, categoria)} className={chip(!marca)}>Todas</Link>
            {ctx.marcas.map((m) => (
              <Link key={m.id} href={enlace(m.slug, categoria)} className={chip(marca === m.slug)}>{m.nombre}</Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-xs text-suave">Tipo</span>
        <div className="flex flex-wrap gap-2">
          <Link href={enlace(marca)} className={chip(!categoria)}>Todo ({todos.length})</Link>
          {categorias.map((c) => (
            <Link key={c.slug} href={enlace(marca, c.slug)} className={chip(categoria === c.slug)}>
              {c.nombre} ({cuenta(c.slug)})
            </Link>
          ))}
        </div>
      </div>

      {materiales.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#c5ced8] bg-white p-8 text-center text-suave">
          Todavía no hay nada{categoria ? ` en ${nombreCategoria.get(categoria) ?? "esta categoría"}` : ""}. Cuando lo publiquemos aparecerá aquí.
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {materiales.map((m) => (
            <li key={m.id} className="flex flex-col overflow-hidden rounded-xl border border-borde bg-white">
              <div className="flex h-24 items-center justify-center bg-[#e3eaf0] text-xs font-semibold tracking-wide text-suave">
                {tipoArchivo(m.mime, m.rutaArchivo)}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3.5">
                <span className="font-semibold break-words">{m.titulo}</span>
                <span className="text-xs text-suave">
                  {[m.marcaId ? nombreMarca.get(m.marcaId) : null, nombreCategoria.get(m.categoria) ?? m.categoria].filter(Boolean).join(" · ")}
                </span>
                <span className="text-xs text-suave">
                  {formatoTamano(m.tamanoBytes)} · {new Date(m.publicadoEn).toLocaleDateString("es-ES")}
                </span>
                <a
                  href={`/api/descargar/${encodeURIComponent(m.id)}?volver=${encodeURIComponent(ruta)}`}
                  className="mt-3 flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-acento font-semibold text-white no-underline hover:bg-acento-oscuro hover:text-white"
                >
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 20h16" />
                  </svg>
                  Descargar
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
