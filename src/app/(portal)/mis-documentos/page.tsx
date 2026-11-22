import { redirect } from "next/navigation";
import { Biblioteca } from "@/components/biblioteca";
import { obtenerContexto } from "@/lib/data";
import { esInterno } from "@/lib/types";

type Params = Promise<{ marca?: string; categoria?: string; aviso?: string }>;

/** Carpeta propia del cliente: Clientes/<Cliente>/... — solo la ve ese cliente. */
export default async function MisDocumentos({ searchParams }: { searchParams: Params }) {
  const ctx = await obtenerContexto();
  if (!ctx) redirect("/login");
  const { marca, categoria, aviso } = await searchParams;
  const interno = esInterno(ctx.usuario.rol);
  return (
    <Biblioteca
      ctx={ctx}
      ambito="cliente"
      ruta="/mis-documentos"
      titulo={interno ? "Documentos de clientes" : "Mis documentos"}
      descripcion={
        interno
          ? "Todo lo que hay en las carpetas de cada cliente."
          : `Documentos solo para ${ctx.distribuidor?.nombre ?? "tu empresa"}: tu lista de precios, contrato, Business Plan y Forecast.`
      }
      marca={marca}
      categoria={categoria}
      aviso={aviso}
      filtroMarca={false}
    />
  );
}
