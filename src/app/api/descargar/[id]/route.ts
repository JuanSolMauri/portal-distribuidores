import { NextResponse, type NextRequest } from "next/server";
import { enlaceDescarga, obtenerContexto } from "@/lib/data";
import { decodificar } from "@/lib/formato";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await obtenerContexto();
  if (!ctx) return NextResponse.redirect(new URL("/login", request.url));

  const { id: crudo } = await params;
  const id = decodificar(crudo);
  const resultado = await enlaceDescarga(ctx, id);
  if ("url" in resultado) return NextResponse.redirect(resultado.url);
  if (resultado.error === "demo") {
    const volver = request.nextUrl.searchParams.get("volver");
    const ruta = volver === "/mis-documentos" ? volver : "/marketing";
    return NextResponse.redirect(new URL(`${ruta}?aviso=demo`, request.url));
  }
  if (resultado.error === "no-encontrado") return new NextResponse("No encontrado", { status: 404 });
  return new NextResponse("No se pudo generar la descarga", { status: 500 });
}
