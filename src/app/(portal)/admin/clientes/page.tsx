import { redirect } from "next/navigation";
import { Mensaje } from "@/components/mensaje";
import { obtenerContexto } from "@/lib/data";
import { listarClientes, listarUsuarios } from "@/lib/data/admin";
import type { Marca, Rol } from "@/lib/types";
import { actualizarCliente, borrarCliente, crearCliente, darAcceso, quitarAcceso } from "../acciones";

type Params = Promise<{ ok?: string; error?: string }>;

const campo = "h-11 rounded-lg border border-borde bg-white px-3 text-tinta";
const boton = "h-11 rounded-lg bg-acento px-5 font-semibold text-white hover:bg-acento-oscuro disabled:opacity-50";

const NOMBRE_ROL: Record<Rol, string> = {
  admin: "Administrador (interno)",
  gestor: "Comercial exportación (interno)",
  marketing: "Marketing (interno)",
  dist_admin: "Cliente: responsable",
  dist_usuario: "Cliente: equipo",
};

/** Botón de borrar con un segundo paso de confirmación, sin diálogos del navegador. */
function Confirmar({ accion, id, texto, aviso, demo }: { accion: (f: FormData) => Promise<void>; id: string; texto: string; aviso: string; demo: boolean }) {
  return (
    <details className="text-left">
      <summary className="inline-flex min-h-9 cursor-pointer list-none items-center rounded-md border border-red-200 px-3 text-sm text-red-800 hover:bg-red-50">
        {texto}
      </summary>
      <form action={accion} className="mt-2 flex flex-col items-start gap-1">
        <input type="hidden" name="id" value={id} />
        <span className="text-xs text-suave">{aviso}</span>
        <button disabled={demo} className="min-h-9 rounded-md bg-red-700 px-3 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-50">
          Sí, {texto.toLowerCase()}
        </button>
      </form>
    </details>
  );
}

function CasillasMarcas({ marcas, marcadas }: { marcas: Marca[]; marcadas: string[] }) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1 text-sm text-suave">Marcas que puede llevar</legend>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {marcas.map((m) => (
          <label key={m.id} className="flex min-h-9 items-center gap-2">
            <input type="checkbox" name="marcas" value={m.id} defaultChecked={marcadas.includes(m.id)} className="size-4" />
            {m.nombre}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default async function AdminClientes({ searchParams }: { searchParams: Params }) {
  const ctx = await obtenerContexto();
  if (!ctx) redirect("/login");
  const { ok, error } = await searchParams;
  const demo = ctx.modo === "demo";
  const [clientes, { usuarios, error: errorUsuarios }] = demo
    ? [[], { usuarios: [], error: undefined }]
    : await Promise.all([listarClientes(), listarUsuarios()]);
  const nombreCliente = new Map(clientes.map((c) => [c.id, c.nombre]));

  return (
    <div className="flex flex-col gap-6">
      <Mensaje ok={ok} error={error} />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Clientes ({clientes.length})</h2>
        {clientes.map((c) => (
          <div key={c.id} className="flex flex-col gap-3 rounded-xl border border-borde bg-white p-5">
          <form action={actualizarCliente} className="flex flex-col gap-4">
            <input type="hidden" name="id" value={c.id} />
            <div className="grid gap-4 sm:grid-cols-[2fr_1fr_auto]">
              <label className="flex flex-col gap-1.5 text-sm text-suave">
                Nombre
                <input name="nombre" defaultValue={c.nombre} required className={campo} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm text-suave">
                País
                <input name="pais" defaultValue={c.pais} required className={campo} />
              </label>
              <label className="flex min-h-11 items-center gap-2 self-end">
                <input type="checkbox" name="activo" defaultChecked={c.activo} className="size-4" />
                Activo
              </label>
            </div>
            <CasillasMarcas marcas={ctx.marcas} marcadas={c.marcaIds} />
            <button disabled={demo} className={`${boton} sm:self-start`}>Guardar</button>
          </form>
          <Confirmar
            accion={borrarCliente}
            id={c.id}
            texto="Borrar cliente"
            aviso="Se borran el cliente, sus marcas y los archivos de su carpeta privada. No se puede deshacer."
            demo={demo}
          />
          </div>
        ))}

        <form action={crearCliente} className="flex flex-col gap-4 rounded-xl border border-dashed border-[#c5ced8] bg-white p-5">
          <h3 className="font-semibold">Nuevo cliente</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm text-suave">
              Nombre
              <input name="nombre" required placeholder="Ej.: Alex" className={campo} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-suave">
              País
              <input name="pais" required className={campo} />
            </label>
          </div>
          <CasillasMarcas marcas={ctx.marcas} marcadas={[]} />
          <button disabled={demo} className={`${boton} sm:self-start`}>Crear cliente</button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Usuarios con acceso ({usuarios.length})</h2>
        {errorUsuarios && (
          <p role="alert" className="rounded-lg bg-amber-50 p-3 text-amber-900">No se pudo leer la lista de usuarios: {errorUsuarios}</p>
        )}
        {usuarios.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-borde bg-white">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-borde text-xs text-suave">
                <tr>
                  <th className="p-3 font-medium">Nombre</th>
                  <th className="p-3 font-medium">Email</th>
                  <th className="p-3 font-medium">Tipo</th>
                  <th className="p-3 font-medium">Cliente</th>
                  <th className="p-3"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id} className="border-b border-borde last:border-0">
                    <td className="p-3">{u.nombre}</td>
                    <td className="p-3 break-all">{u.email}</td>
                    <td className="p-3">{NOMBRE_ROL[u.rol]}</td>
                    <td className="p-3">{u.distribuidorId ? nombreCliente.get(u.distribuidorId) ?? "?" : "—"}</td>
                    <td className="p-3">
                      {u.id !== ctx.usuario.id && (
                        <Confirmar accion={quitarAcceso} id={u.id} texto="Quitar acceso" aviso="Ya no podrá ver nada del portal." demo={demo} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form action={darAcceso} className="flex flex-col gap-4 rounded-xl border border-dashed border-[#c5ced8] bg-white p-5">
          <h3 className="font-semibold">Dar acceso a una persona</h3>
          <p className="text-sm text-suave">
            Primero crea su usuario en Supabase: Authentication, Users, Add user, Create new user (email y contraseña). Después rellena esto.
            Si la persona ya tiene acceso, sirve para cambiar su tipo o su cliente.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm text-suave">
              Email
              <input name="email" type="email" required className={campo} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-suave">
              Nombre
              <input name="nombre" required className={campo} />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-suave">
              Tipo de usuario
              <select name="rol" defaultValue="dist_admin" className={campo}>
                {(Object.keys(NOMBRE_ROL) as Rol[]).map((r) => <option key={r} value={r}>{NOMBRE_ROL[r]}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-suave">
              Cliente (vacío para internos)
              <select name="distribuidor" defaultValue="" className={campo}>
                <option value="">—</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </label>
          </div>
          <button disabled={demo} className={`${boton} sm:self-start`}>Dar acceso</button>
        </form>
      </section>
    </div>
  );
}
