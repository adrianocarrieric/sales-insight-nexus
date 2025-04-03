import Papa from "papaparse";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Venta } from "../hooks/useSalesData";

dayjs.extend(customParseFormat);

export const parseCSVData = (csvText: string): Venta[] => {
  if (!csvText) return [];

  // Verificar si lo que se está intentando parsear es HTML
  if (csvText.trim().startsWith('<!DOCTYPE html>') || 
      csvText.trim().startsWith('<html') || 
      csvText.includes('<head>')) {
    console.warn("El archivo cargado parece ser HTML, no un CSV válido");
    return [];
  }

  try {
    const parsed = Papa.parse(csvText, {
      header: true, // Cambiar a true para usar los encabezados del CSV
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(), // Limpiar espacios en encabezados
    });

    const data = parsed.data;
    if (!data || data.length === 0) {
        console.error("El archivo CSV está vacío o con errores:", parsed.errors);
        return [];
    }

    return data.map((row: any) => {
      // Convertir la fecha usando dayjs
      const fecha = dayjs(row.Fecha, ["D/M/YY H:mm", "DD/MM/YYYY HH:mm"], true);
      if (!fecha.isValid()) {
        console.warn(`Fecha inválida detectada: "${row.Fecha}"`);
      }

      const fechaFinal = fecha.isValid() ? fecha.toDate() : null;

      // Convertir los valores numéricos
      const cantidad = !isNaN(parseFloat(row.Cantidad)) ? parseFloat(row.Cantidad) : 0;
      const ventasNetas = !isNaN(parseFloat(row.VentasNetas)) ? parseFloat(row.VentasNetas) : 0;

      return {
        Fecha: fechaFinal,
        NumeroRecibo: row.NumeroRecibo || "",
        TipoRecibo: row.TipoRecibo || "",
        Categoria: row.Categoria || "",
        REF: row.REF || "",
        Articulo: row.Articulo || "",
        Cantidad: cantidad,
        VentasNetas: ventasNetas,
      };
    });
  } catch (error) {
    console.error("Error al parsear CSV:", error);
    return [];
  }
};