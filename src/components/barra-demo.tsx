"use client";

import { usePathname } from "next/navigation";
import { cambiarUsuarioDemo } from "@/app/acciones";

interface Props {
  actual: string;
  opciones: { clave: string; nombre: string }[];
}

/** Solo en modo demo: permite ver el portal como distintos distribuidores. */
export function BarraDemo({ actual, opciones }: Props) {
  const ruta = usePathname();
  return (
    <form action={cambiarUsuarioDemo} className="flex flex-wrap items-center gap-2 bg-amber-50 px-6 py-2 text-[13px] text-amber-900">
      <strong>Modo demo</strong>
      <span>· datos de ejemplo. Ver el portal como:</span>
      <input type="hidden" name="volver" value={ruta} />
      <label className="sr-only" htmlFor="usuario-demo">Usuario de ejemplo</label>
      <select
        id="usuario-demo"
        name="usuario"
        defaultValue={actual}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-8 rounded-md border border-amber-300 bg-white px-2"
      >
        {opciones.map((o) => (
          <option key={o.clave} value={o.clave}>{o.nombre}</option>
        ))}
      </select>
      <noscript><button className="h-8 rounded-md border border-amber-300 bg-white px-2">Cambiar</button></noscript>
    </form>
  );
}
