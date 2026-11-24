import { redirect } from "next/navigation";
import { modoDemo } from "@/lib/config";
import { FormularioEntrar } from "./formulario";

export default function Login() {
  if (modoDemo) redirect("/inicio");
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl border border-borde bg-white p-8">
        <h1 className="text-xl font-semibold">Portal de distribuidores</h1>
        <p className="mt-1 text-suave">Acceso solo por invitación.</p>
        <FormularioEntrar />
      </div>
    </main>
  );
}
