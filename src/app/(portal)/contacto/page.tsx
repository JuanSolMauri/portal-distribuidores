import { EnConstruccion } from "@/components/en-construccion";

export default function Contacto() {
  return (
    <EnConstruccion
      titulo="Contacto"
      descripcion="Las personas de contacto de cada distribuidor y un formulario de consulta."
      puntos={["Gestor de cuenta asignado", "Contactos de logística y marketing", "Formulario de consulta por email"]}
    />
  );
}
