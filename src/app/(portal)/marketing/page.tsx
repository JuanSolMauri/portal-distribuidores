import { redirect } from "next/navigation";
import { Biblioteca } from "@/components/biblioteca";
import { obtenerContexto } from "@/lib/data";

type Params = Promise<{ marca?: string; categoria?: string; aviso?: string }>;

/** Carpetas comunes: Comun/<Marca>/... — las ve todo cliente con esa marca. */
export default async function Marketing({ searchParams }: { searchParams: Params }) {
  const ctx = await obtenerContexto();
  if (!ctx) redirect("/login");
  const { marca, categoria, aviso } = await searchParams;
  return (
    <Biblioteca
      ctx={ctx}
      ambito="comun"
      ruta="/marketing"
      titulo="Marketing"
      descripcion="Material de las marcas que llevas: presentaciones, fotos, logotipos, vídeos y PLV."
      marca={marca}
      categoria={categoria}
      aviso={aviso}
      filtroMarca
    />
  );
}
