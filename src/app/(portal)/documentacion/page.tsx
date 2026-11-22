import { EnConstruccion } from "@/components/en-construccion";

export default function Documentacion() {
  return (
    <EnConstruccion
      titulo="Documentación"
      descripcion="Documentación técnica y regulatoria por marca y país."
      puntos={["Certificados y registros de producto", "Fichas de seguridad", "Condiciones logísticas"]}
    />
  );
}
