import Link from "next/link";
import { redirect } from "next/navigation";
import { listarCategorias, listarMateriales, obtenerContexto } from "@/lib/data";
import { formatoTamano, tipoArchivo } from "@/lib/formato";

type Params = Promise<{ marca?: string; categoria?: string; aviso?: string }>;

function enlace(marca?: string, categoria?: string) {
  const q = new URLSearchParams();
  if (marca) q.set("marca", marca);
  if (categoria) q.set("categoria", categoria);
  const s = q.toString();
  return s ? `/marketing?${s}` : "/marketing";
}

const chip = (activo: boolean) =>
  `inline-flex min-h-9 items-center rounded-full border px-3.5 text-[13px] no-underline ${
    activo ? "border-acento bg-acento font-semibold text-white hover:text-white" : "border-[#c5ced8] bg-white text-tinta"
  }`;

export default async function Marketing({ searchParams }: { searchParams: Params }) {
  const ctx = await obtenerContexto();
  if (!ctx) redirect("/login");
  const { marca, categoria, aviso } = await searchParams;

  const [categorias, todos] = await Promise.all([listarCategorias(), listarMateriales(ctx, { marca })]);
  const materiales = categoria ? todos.filter((m) => m.categoria === categoria) : todos;
  const nombreMarca = new Map(ctx.marcas.map((m) => [m.id, m.nombre]));
  const nombreCategoria = new Map(categorias.map((c) => [c.slug, c.nombre]));
  const cuenta = (slug: string) => todos.filter((m) => m.categoria === slug).length;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Marketing</h1>

      {aviso === "demo" && (
        <p role="status" className="rounded-lg bg-amber-50 p-3 text-amber-900">
          En modo demo no hay archivos reales. Con Supabase conectado, este botón descarga el archivo con un enlace que caduca en 5 minutos.
        </p>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-xs text-suave">Marca</span>
        <div className="flex flex-wrap gap-2">
          <Link href={enlace(undefined, categoria)} className={chip(!marca)}>Todas</Link>
          {ctx.marcas.map((m) => (
            <Link key={m.id} href={enlace(m.slug, categoria)} className={chip(marca === m.slug)}>{m.nombre}</Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-suave">Tipo de material</span>
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
          Todavía no hay materiales{categoria ? ` en ${nombreCategoria.get(categoria) ?? "esta categoría"}` : ""}. Cuando el equipo de marketing los publique aparecerán aquí.
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
                  {nombreMarca.get(m.marcaId)} · {nombreCategoria.get(m.categoria) ?? m.categoria}
                </span>
                <span className="text-xs text-suave">
                  {formatoTamano(m.tamanoBytes)} · {new Date(m.publicadoEn).toLocaleDateString("es-ES")}
                </span>
                <a
                  href={`/api/descargar/${encodeURIComponent(m.id)}`}
                  className="mt-auto flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-acento font-semibold text-white no-underline hover:bg-acento-oscuro hover:text-white"
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
