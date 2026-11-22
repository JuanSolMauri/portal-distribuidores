interface Props {
  titulo: string;
  descripcion: string;
  puntos: string[];
}

/** Pestaña prevista en el MVP que aún no está construida. */
export function EnConstruccion({ titulo, descripcion, puntos }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      <div className="rounded-xl border border-borde bg-white p-6">
        <p className="font-medium">Próximamente</p>
        <p className="mt-1 text-suave">{descripcion}</p>
        <ul className="mt-3 list-disc pl-5 text-suave">
          {puntos.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
