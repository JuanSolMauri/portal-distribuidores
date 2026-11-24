import { EnConstruccion } from "@/components/en-construccion";

export default function Contrato() {
  return (
    <EnConstruccion
      titulo="Contrato"
      descripcion="El contrato vigente del distribuidor y sus anexos, para ver y descargar."
      puntos={["Vigencia, territorio y marcas", "PDF del contrato y anexos", "Aviso antes del vencimiento"]}
    />
  );
}
