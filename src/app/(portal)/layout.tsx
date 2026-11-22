import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { salir } from "@/app/acciones";
import { BarraDemo } from "@/components/barra-demo";
import { Navegacion } from "@/components/navegacion";
import { COOKIE_DEMO, obtenerContexto } from "@/lib/data";
import { usuarioDemoPorDefecto, usuariosDemo } from "@/lib/data/demo";
import { esInterno } from "@/lib/types";

export default async function LayoutPortal({ children }: { children: React.ReactNode }) {
  const ctx = await obtenerContexto();
  if (!ctx) redirect("/login");
  const claveDemo = (await cookies()).get(COOKIE_DEMO)?.value ?? usuarioDemoPorDefecto;

  return (
    <div className="min-h-screen">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-marino px-6 py-3.5 text-white">
        <div className="flex flex-col">
          <span className="text-[15px] font-semibold">Portal de distribuidores</span>
          <span className="text-xs text-[#b8c7d6]">Partner Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[13px] font-semibold">{ctx.distribuidor?.nombre ?? "Equipo interno"}</span>
            <span className="text-xs text-[#b8c7d6]">
              {ctx.distribuidor ? `${ctx.distribuidor.pais} · ` : ""}
              {ctx.usuario.nombre}
            </span>
          </div>
          {ctx.modo === "supabase" && (
            <form action={salir}>
              <button className="min-h-9 rounded-md border border-white/30 px-3 text-[13px] hover:bg-white/10">Salir</button>
            </form>
          )}
        </div>
      </header>

      {ctx.modo === "demo" && (
        <BarraDemo
          actual={claveDemo}
          opciones={Object.entries(usuariosDemo).map(([clave, u]) => ({ clave, nombre: u.usuario.nombre }))}
        />
      )}

      <div className="flex flex-wrap items-center gap-2 border-b border-borde bg-white px-6 py-2.5">
        <span className="mr-1 text-xs text-suave">{esInterno(ctx.usuario.rol) ? "Marcas:" : "Marcas autorizadas:"}</span>
        {ctx.marcas.length === 0 && <span className="text-xs text-suave">ninguna todavía</span>}
        {ctx.marcas.map((m) => (
          <span key={m.id} className="rounded-full border border-acento px-3 py-1 text-[13px] font-medium text-acento">
            {m.nombre}
          </span>
        ))}
      </div>

      <div className="mx-auto flex max-w-[1360px] flex-col gap-6 p-4 md:flex-row md:p-6">
        <aside className="md:w-56 md:shrink-0">
          <Navegacion />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
