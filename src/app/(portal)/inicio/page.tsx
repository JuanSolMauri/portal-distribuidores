import Link from "next/link";
import { redirect } from "next/navigation";
import { listarCategorias, listarMateriales, obtenerContexto } from "@/lib/data";

export default async function Inicio() {
  const ctx = await obtenerContexto();
  if (!ctx) redirect("/login");
  const [categorias, materiales] = await Promise.all([listarCategorias(), listarMateriales(ctx)]);
  const nombreCategoria = new Map(categorias.map((c) => [c.slug, c.nombre]));
  const nombreMarca = new Map(ctx.marcas.map((m) => [m.id, m.nombre]));
  const recientes = materiales.slice(0, 5);
  const primerNombre = ctx.usuario.nombre.split(" ")[0];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-semibold">Hola, {primerNombre}</h1>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {ctx.marcas.map((m) => {
          const n = materiales.filter((x) => x.marcaId === m.id).length;
          return (
            <Link key={m.id} href={`/marketing?marca=${m.slug}`} className="flex flex-col gap-1.5 rounded-xl border border-borde bg-white p-4.5 text-tinta no-underline hover:border-acento">
              <span className="text-xs text-suave">Marca</span>
              <span className="text-lg font-semibold">{m.nombre}</span>
              <span className="text-xs text-suave">{n === 1 ? "1 material" : `${n} materiales`} de marketing</span>
            </Link>
          );
        })}
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-borde bg-white p-4.5">
        <h2 className="text-base font-semibold">Últimos materiales</h2>
        {recientes.length === 0 ? (
          <p className="text-suave">Aún no hay materiales publicados.</p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {recientes.map((m) => (
              <li key={m.id} className="flex flex-wrap items-baseline gap-x-3">
                <span className="w-20 text-xs text-suave">{new Date(m.publicadoEn).toLocaleDateString("es-ES")}</span>
                <span className="min-w-0 flex-1 break-words">{m.titulo}</span>
                <span className="text-xs text-suave">
                  {nombreMarca.get(m.marcaId)} · {nombreCategoria.get(m.categoria) ?? m.categoria}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link href="/marketing" className="self-start font-medium">Ir a Marketing</Link>
      </section>
    </div>
  );
}
