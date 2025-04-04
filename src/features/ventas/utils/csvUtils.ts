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
    return [];
  }

  try {
    // Intentamos detectar automáticamente el delimitador
    const muestraCSV = csvText.split("\n").slice(0, 3).join("\n");
    let delimitador = ","; // por defecto

    // Intentar detectar el delimitador
    if (muestraCSV.includes(";") && !muestraCSV.includes(",")) {
      delimitador = ";";
    } else if (muestraCSV.includes("\t") && !muestraCSV.includes(",")) {
      delimitador = "\t";
    }


    const parsed = Papa.parse(csvText, {
      header: true, // Usar los encabezados del CSV
      skipEmptyLines: true,
      delimiter: delimitador,
      transformHeader: (header) => header.trim(), // Limpiar espacios en encabezados
    });

    const data = parsed.data;
    if (!data || data.length === 0) {
        return [];
    }

    // Convertir los datos a nuestro formato
    const ventasParsed = data.map((row: any) => {
      // Convertir la fecha usando dayjs con múltiples formatos y modo no estricto
      const fecha = dayjs(row.Fecha, [
        "D/M/YY", 
        "D/M/YY H:mm", 
        "DD/MM/YYYY", 
        "DD/MM/YYYY HH:mm",
        "YYYY-MM-DD",
        "YYYY-MM-DD HH:mm",
        "DD-MM-YYYY",
        "DD-MM-YYYY HH:mm"
      ], false);

      if (!fecha.isValid()) {
        return null;
      }

      const fechaFinal = fecha.isValid() ? fecha.toDate() : null;

      // Normalización para evitar problemas con caracteres especiales y espacios
      const normalizarTexto = (texto: string | undefined | null): string => {
        if (!texto) return "";
        return texto.trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
      };

      // Mejoramos el parseo considerando variantes del nombre del campo NumeroRecibo
      let numeroRecibo = row.NumeroRecibo?.trim() || 
                         row["Número de Recibo"]?.trim() || 
                         row["Recibo"]?.trim() || 
                         row["NroRecibo"]?.trim() || 
                         row["Nro Recibo"]?.trim() || 
                         row["Numero Recibo"]?.trim() || 
                         "";

      // Buscar en las claves normalizadas si no encontramos el numero de recibo
      if (!numeroRecibo) {
        const claveNormalizada = Object.keys(row).find(k => 
          normalizarTexto(k).includes("recibo") || 
          normalizarTexto(k).includes("factura") ||
          normalizarTexto(k).includes("comprobante")
        );

        if (claveNormalizada) {
          numeroRecibo = row[claveNormalizada]?.trim() || "";
        }
      }

      // Convertir los valores numéricos
      const cantidad = !isNaN(parseFloat(row.Cantidad)) ? parseFloat(row.Cantidad) : 0;
      const ventasNetas = !isNaN(parseFloat(row.VentasNetas)) ? parseFloat(row.VentasNetas) : 0;


      return {
        Fecha: fechaFinal,
        NumeroRecibo: numeroRecibo,
        TipoRecibo: row.TipoRecibo || "",
        Categoria: row.Categoria || "",
        REF: row.REF || "",
        Articulo: row.Articulo || "",
        Cantidad: cantidad,
        VentasNetas: ventasNetas,
      };
    });

    return ventasParsed;
  } catch (error) {
    return [];
  }
};