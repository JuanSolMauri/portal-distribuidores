"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const PESTANAS = [
  { href: "/inicio", nombre: "Inicio" },
  { href: "/marketing", nombre: "Marketing" },
  { href: "/mis-documentos", nombre: "Mis documentos" },
  { href: "/business-plan", nombre: "Business Plan" },
  { href: "/pedidos", nombre: "Pedidos" },
  { href: "/contrato", nombre: "Contrato" },
  { href: "/documentacion", nombre: "Documentación" },
  { href: "/contacto", nombre: "Contacto" },
] as const;

export function Navegacion({ interno }: { interno: boolean }) {
  const ruta = usePathname();
  const pestanas = interno ? [...PESTANAS, { href: "/admin", nombre: "Administración" }] : PESTANAS;
  return (
    <nav aria-label="Secciones" className="flex gap-1 overflow-x-auto md:flex-col">
      {pestanas.map((p) => {
        const activa = ruta === p.href || ruta.startsWith(`${p.href}/`);
        return (
          <Link
            key={p.href}
            href={p.href}
            aria-current={activa ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center rounded-lg px-3.5 no-underline ${
              activa ? "bg-acento-claro font-semibold text-acento-oscuro" : "text-[#33414f] hover:bg-white"
            }`}
          >
            {p.nombre}
          </Link>
        );
      })}
    </nav>
  );
}
