import { EnConstruccion } from "@/components/en-construccion";

export default function BusinessPlan() {
  return (
    <EnConstruccion
      titulo="Business Plan"
      descripcion="Formulario anual por marca que el distribuidor rellena y envía para revisión."
      puntos={[
        "Objetivos de venta por trimestre, en unidades y euros",
        "Canales, clientes clave y acciones de marketing con presupuesto",
        "Guardar borrador, enviar y recibir comentarios o aprobación",
      ]}
    />
  );
}
