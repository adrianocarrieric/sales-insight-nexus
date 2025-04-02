
import Papa from "papaparse";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Venta } from "../hooks/useSalesData";

dayjs.extend(customParseFormat);

export const parseCSVData = (csvText: string): Venta[] => {
  if (!csvText) return [];
  
  try {
    const parsed = Papa.parse(csvText, {
      header: false,
      skipEmptyLines: true,
    });
    
    const data = parsed.data;
    if (!data || data.length <= 1) return [];
    
    // Omitir la primera fila (encabezados) y mapear el resto a objetos Venta
    return data.slice(1).map((columns: any) => {
      // Convertir la fecha usando dayjs
      const fecha = dayjs(columns[0], "D/M/YY H:mm", true);
      if (!fecha.isValid()) {
        console.warn(`Fecha inválida detectada: "${columns[0]}"`);
      }
      
      const fechaFinal = fecha.isValid() ? fecha.toDate() : null;
      
      // Convertir los valores numéricos
      const cantidad = isNaN(parseFloat(columns[8])) ? 0 : parseFloat(columns[8]);
      const ventasNetas = isNaN(parseFloat(columns[11])) ? 0 : parseFloat(columns[11]);
      
      return {
        Fecha: fechaFinal,
        NumeroRecibo: columns[1] || "",
        TipoRecibo: columns[2] || "",
        Categoria: columns[3] || "",
        REF: columns[4] || "",
        Articulo: columns[5] || "",
        Cantidad: cantidad,
        VentasNetas: ventasNetas,
      };
    });
  } catch (error) {
    console.error("Error al parsear CSV:", error);
    return [];
  }
};
