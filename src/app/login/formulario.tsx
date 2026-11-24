"use client";

import { useActionState } from "react";
import { entrar } from "@/app/acciones";

export function FormularioEntrar() {
  const [estado, accion, enviando] = useActionState(entrar, undefined);
  return (
    <form action={accion} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-suave">
        Email
        <input name="email" type="email" autoComplete="email" required className="h-11 rounded-lg border border-borde px-3 text-tinta" />
      </label>
      <label className="flex flex-col gap-1.5 text-suave">
        Contraseña
        <input name="password" type="password" autoComplete="current-password" required className="h-11 rounded-lg border border-borde px-3 text-tinta" />
      </label>
      {estado?.error && <p role="alert" className="text-red-700">{estado.error}</p>}
      <button disabled={enviando} className="h-11 rounded-lg bg-acento font-semibold text-white hover:bg-acento-oscuro disabled:opacity-60">
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
