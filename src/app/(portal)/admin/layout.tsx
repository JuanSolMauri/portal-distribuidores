import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerContexto } from "@/lib/data";
import { esInterno } from "@/lib/types";

/** Administración: solo para el equipo interno. RLS lo vuelve a comprobar en cada cambio. */
export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  const ctx = await obtenerContexto();
  if (!ctx || !esInterno(ctx.usuario.rol)) redirect("/inicio");
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Administración</h1>
        <p className="text-suave">Solo la ve el equipo interno. Lo que subas aquí lo verán los clientes según sus marcas.</p>
      </div>
      <nav aria-label="Administración" className="flex gap-2">
        <Link href="/admin/archivos" className="inline-flex min-h-9 items-center rounded-full border border-[#c5ced8] bg-white px-3.5 text-[13px] text-tinta no-underline">Archivos</Link>
        <Link href="/admin/clientes" className="inline-flex min-h-9 items-center rounded-full border border-[#c5ced8] bg-white px-3.5 text-[13px] text-tinta no-underline">Clientes y usuarios</Link>
      </nav>
      {ctx.modo === "demo" && (
        <p role="status" className="rounded-lg bg-amber-50 p-3 text-amber-900">En modo demo puedes ver estas pantallas, pero no se guarda nada.</p>
      )}
      {children}
    </div>
  );
}
