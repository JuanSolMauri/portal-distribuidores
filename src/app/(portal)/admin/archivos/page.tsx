import { redirect } from "next/navigation";
import { Mensaje } from "@/components/mensaje";
import { listarCategorias, listarMateriales, obtenerContexto } from "@/lib/data";
import { listarClientes } from "@/lib/data/admin";
import { formatoTamano } from "@/lib/formato";
import { borrarMaterial } from "../acciones";
import { SubirArchivos } from "./subir";

type Params = Promise<{ ok?: string; error?: string }>;

export default async function AdminArchivos({ searchParams }: { searchParams: Params }) {
  const ctx = await obtenerContexto();
  if (!ctx) redirect("/login");
  const { ok, error } = await searchParams;
  const demo = ctx.modo === "demo";

  const [categorias, materiales, clientes] = await Promise.all([
    listarCategorias(),
    listarMateriales(ctx),
    demo ? Promise.resolve([]) : listarClientes(),
  ]);
  const nombreMarca = new Map(ctx.marcas.map((m) => [m.id, m.nombre]));
  const nombreCliente = new Map(clientes.map((c) => [c.id, c.nombre]));
  const nombreCategoria = new Map(categorias.map((c) => [c.slug, c.nombre]));

  return (
    <div className="flex flex-col gap-5">
      <Mensaje ok={ok} error={error} />
      <SubirArchivos marcas={ctx.marcas} clientes={clientes} categorias={categorias} demo={demo} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Archivos publicados ({materiales.length})</h2>
        {materiales.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[#c5ced8] bg-white p-6 text-center text-suave">Todavía no hay archivos.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-borde bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-borde text-xs text-suave">
                <tr>
                  <th className="p-3 font-medium">Archivo</th>
                  <th className="p-3 font-medium">Lo ve</th>
                  <th className="p-3 font-medium">Carpeta</th>
                  <th className="p-3 font-medium">Tamaño</th>
                  <th className="p-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {materiales.map((m) => (
                  <tr key={m.id} className="border-b border-borde last:border-0">
                    <td className="p-3 break-all">
                      <a href={`/ver/${encodeURIComponent(m.id)}?volver=/admin/archivos`}>{m.titulo}</a>
                    </td>
                    <td className="p-3">
                      {m.distribuidorId
                        ? `Solo ${nombreCliente.get(m.distribuidorId) ?? "un cliente"}`
                        : `Clientes de ${m.marcaId ? nombreMarca.get(m.marcaId) : "?"}`}
                    </td>
                    <td className="p-3">{nombreCategoria.get(m.categoria) ?? m.categoria}</td>
                    <td className="p-3 whitespace-nowrap">{formatoTamano(m.tamanoBytes)}</td>
                    <td className="p-3 text-right">
                      <details className="inline-block text-left">
                        <summary className="inline-flex min-h-9 cursor-pointer list-none items-center rounded-md border border-red-200 px-3 text-red-800 hover:bg-red-50">
                          Borrar
                        </summary>
                        <form action={borrarMaterial} className="mt-2 flex flex-col items-end gap-1">
                          <input type="hidden" name="id" value={m.id} />
                          <span className="text-xs text-suave">Los clientes dejarán de verlo.</span>
                          <button disabled={demo} className="min-h-9 rounded-md bg-red-700 px-3 font-semibold text-white hover:bg-red-800 disabled:opacity-50">
                            Sí, borrar
                          </button>
                        </form>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
