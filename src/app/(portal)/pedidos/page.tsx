import { EnConstruccion } from "@/components/en-construccion";

export default function Pedidos() {
  return (
    <EnConstruccion
      titulo="Pedidos"
      descripcion="Pedido por referencia y unidades a partir de la lista de precios del distribuidor."
      puntos={[
        "Búsqueda por referencia, EAN o nombre, solo de las marcas autorizadas",
        "Unidades, subtotal y total con el precio de exportación de su tarifa",
        "Historial de pedidos con su estado y exportación a Excel",
      ]}
    />
  );
}
