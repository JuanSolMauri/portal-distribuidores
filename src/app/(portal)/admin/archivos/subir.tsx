"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/navegador";
import type { Ambito, Categoria, Marca } from "@/lib/types";

interface Props {
  marcas: Marca[];
  clientes: { id: string; nombre: string }[];
  categorias: Categoria[];
  demo: boolean;
}

interface Resultado {
  nombre: string;
  ok: boolean;
  detalle?: string;
}

/** Nombre seguro para guardar en el almacenamiento: sin acentos, espacios ni símbolos. */
export function nombreSeguro(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

const campo = "h-11 rounded-lg border border-borde bg-white px-3 text-tinta";
const MAX_BYTES = 50 * 1024 * 1024;

/**
 * Sube los archivos directamente del navegador a Supabase (sin pasar por Vercel,
 * que limita el tamaño). Primero registra el material y después sube el archivo.
 */
export function SubirArchivos({ marcas, clientes, categorias, demo }: Props) {
  const router = useRouter();
  const [ambito, setAmbito] = useState<Ambito>("comun");
  const [marca, setMarca] = useState(marcas[0]?.id ?? "");
  const [cliente, setCliente] = useState(clientes[0]?.id ?? "");
  const [categoria, setCategoria] = useState("");
  const [archivos, setArchivos] = useState<File[]>([]);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [resultados, setResultados] = useState<Resultado[]>([]);

  const cats = useMemo(() => categorias.filter((c) => c.ambito === ambito), [categorias, ambito]);
  const categoriaElegida = cats.some((c) => c.slug === categoria) ? categoria : (cats[0]?.slug ?? "");
  const marcaSlug = marcas.find((m) => m.id === marca)?.slug;
  const destinoListo = ambito === "comun" ? !!marcaSlug : !!cliente;

  async function subir(e: React.FormEvent) {
    e.preventDefault();
    if (demo || archivos.length === 0 || !destinoListo || !categoriaElegida) return;
    const supabase = crearClienteNavegador();
    const salida: Resultado[] = [];

    for (const archivo of archivos) {
      setSubiendo(archivo.name);
      if (archivo.size > MAX_BYTES) {
        salida.push({ nombre: archivo.name, ok: false, detalle: "Pesa más de 50 MB, el máximo del plan gratuito de Supabase." });
        continue;
      }
      const carpeta = ambito === "comun" ? `comun/${marcaSlug}` : `clientes/${cliente}`;
      const ruta = `${carpeta}/${categoriaElegida}/${nombreSeguro(archivo.name) || "archivo"}`;
      const fila = {
        marca_id: ambito === "comun" ? marca : marca || null,
        distribuidor_id: ambito === "cliente" ? cliente : null,
        categoria: categoriaElegida,
        titulo: archivo.name.replace(/\.[^.]+$/, ""),
        ruta_archivo: ruta,
        mime: archivo.type || null,
        tamano_bytes: archivo.size,
        publicado: true,
        publicado_en: new Date().toISOString(),
      };

      const { error: errorFila } = await supabase.from("materiales").upsert(fila, { onConflict: "ruta_archivo" });
      if (errorFila) {
        salida.push({ nombre: archivo.name, ok: false, detalle: errorFila.message });
        continue;
      }
      const { error: errorArchivo } = await supabase.storage
        .from("marketing")
        .upload(ruta, archivo, { upsert: true, contentType: archivo.type || undefined });
      if (errorArchivo) {
        await supabase.from("materiales").delete().eq("ruta_archivo", ruta);
        salida.push({ nombre: archivo.name, ok: false, detalle: errorArchivo.message });
        continue;
      }
      salida.push({ nombre: archivo.name, ok: true });
    }

    setSubiendo(null);
    setResultados(salida);
    if (salida.some((r) => r.ok)) {
      setArchivos([]);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    }
  }

  return (
    <form onSubmit={subir} className="flex flex-col gap-4 rounded-xl border border-borde bg-white p-5">
      <h2 className="text-lg font-semibold">Subir archivos</h2>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm text-suave">¿Quién lo ve?</legend>
        <label className="flex items-center gap-2">
          <input type="radio" name="ambito" checked={ambito === "comun"} onChange={() => setAmbito("comun")} className="size-4" />
          Común: todos los clientes que llevan una marca
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="ambito" checked={ambito === "cliente"} onChange={() => setAmbito("cliente")} className="size-4" />
          Solo un cliente (su carpeta privada)
        </label>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        {ambito === "cliente" && (
          <label className="flex flex-col gap-1.5 text-sm text-suave">
            Cliente
            {clientes.length === 0 ? (
              <span className="text-tinta">Primero da de alta un cliente en «Clientes y usuarios».</span>
            ) : (
              <select value={cliente} onChange={(e) => setCliente(e.target.value)} className={campo}>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            )}
          </label>
        )}
        <label className="flex flex-col gap-1.5 text-sm text-suave">
          Marca{ambito === "cliente" ? " (opcional)" : ""}
          <select value={marca} onChange={(e) => setMarca(e.target.value)} className={campo}>
            {ambito === "cliente" && <option value="">Sin marca concreta</option>}
            {marcas.map((m) => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-suave">
          Carpeta
          <select value={categoriaElegida} onChange={(e) => setCategoria(e.target.value)} className={campo}>
            {cats.map((c) => <option key={c.slug} value={c.slug}>{c.nombre}</option>)}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1.5 text-sm text-suave">
        Archivos (puedes elegir varios; máximo 50 MB cada uno)
        <input
          type="file"
          multiple
          onChange={(e) => setArchivos(Array.from(e.target.files ?? []))}
          className="rounded-lg border border-dashed border-[#c5ced8] p-3 text-tinta file:mr-3 file:rounded-md file:border-0 file:bg-acento-claro file:px-3 file:py-1.5 file:text-acento-oscuro"
        />
      </label>

      <p className="text-xs text-suave">Si subes un archivo con el mismo nombre en la misma carpeta, sustituye al anterior.</p>

      <button
        disabled={demo || !!subiendo || archivos.length === 0 || !destinoListo}
        className="h-11 rounded-lg bg-acento px-5 font-semibold text-white hover:bg-acento-oscuro disabled:opacity-50 sm:self-start"
      >
        {subiendo ? `Subiendo ${subiendo}…` : `Subir ${archivos.length || ""} ${archivos.length === 1 ? "archivo" : "archivos"}`}
      </button>

      {resultados.length > 0 && (
        <ul role="status" className="flex flex-col gap-1 text-sm">
          {resultados.map((r) => (
            <li key={r.nombre} className={r.ok ? "text-emerald-800" : "text-red-800"}>
              {r.ok ? "✓" : "✗"} {r.nombre}{r.detalle ? `: ${r.detalle}` : ""}
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
