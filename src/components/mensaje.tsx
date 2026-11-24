/** Resultado de una acción, leído de ?ok= o ?error= en la dirección. */
export function Mensaje({ ok, error }: { ok?: string; error?: string }) {
  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>;
  if (ok) return <p role="status" className="rounded-lg bg-emerald-50 p-3 text-emerald-900">{ok}</p>;
  return null;
}
