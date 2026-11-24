import { redirect } from "next/navigation";
import { salir } from "@/app/acciones";
import { modoDemo } from "@/lib/config";
import { FormularioEntrar } from "./formulario";

type Params = Promise<{ motivo?: string; detalle?: string }>;

const MENSAJES: Record<string, string> = {
  "sin-perfil": "Tu usuario existe pero todavía no tiene acceso al portal. Pide al administrador que te dé de alta.",
  error: "No se ha podido cargar tu perfil. Avisa al administrador con este detalle:",
};

export default async function Login({ searchParams }: { searchParams: Params }) {
  if (modoDemo) redirect("/inicio");
  const { motivo, detalle } = await searchParams;
  const aviso = motivo ? MENSAJES[motivo] : undefined;
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-borde bg-white p-8">
        <h1 className="text-xl font-semibold">Portal de distribuidores</h1>
        <p className="mt-1 text-suave">Acceso solo por invitación.</p>
        {aviso && (
          <div role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-amber-900">
            <p>{aviso}</p>
            {detalle && <p className="mt-1 font-mono text-xs break-words">{detalle}</p>}
            <form action={salir} className="mt-2">
              <button className="text-xs underline">Cerrar sesión y probar con otro usuario</button>
            </form>
          </div>
        )}
        <FormularioEntrar />
      </div>
    </main>
  );
}
