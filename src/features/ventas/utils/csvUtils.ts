
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
    // Intentamos detectar automáticamente el delimitador
    const muestraCSV = csvText.split("\n").slice(0, 3).join("\n");
    let delimitador = ","; // por defecto
    
    // Intentar detectar el delimitador
    if (muestraCSV.includes(";") && !muestraCSV.includes(",")) {
      delimitador = ";";
    } else if (muestraCSV.includes("\t") && !muestraCSV.includes(",")) {
      delimitador = "\t";
    }
    
    console.log(`🔄 Parseando CSV con delimitador: "${delimitador}"`);

    const parsed = Papa.parse(csvText, {
      header: true, // Usar los encabezados del CSV
      skipEmptyLines: true,
      delimiter: delimitador,
      transformHeader: (header) => header.trim(), // Limpiar espacios en encabezados
    });

    const data = parsed.data;
    if (!data || data.length === 0) {
        console.error("El archivo CSV está vacío o con errores:", parsed.errors);
        return [];
    }

    // Mostrar los encabezados detectados para diagnóstico
    if (data.length > 0) {
      const primeraFila = data[0];
      console.log("📑 Encabezados detectados:", Object.keys(primeraFila));
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
        console.warn(`⚠️ Fecha inválida detectada: "${row.Fecha}"`);
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
          console.log(`🔍 Encontrada clave alternativa para recibo: "${claveNormalizada}"`);
        }
      }
      
      // Convertir los valores numéricos
      const cantidad = !isNaN(parseFloat(row.Cantidad)) ? parseFloat(row.Cantidad) : 0;
      const ventasNetas = !isNaN(parseFloat(row.VentasNetas)) ? parseFloat(row.VentasNetas) : 0;
      
      // Log para depuración
      console.log(`📝 Parsed fila → Fecha: ${row.Fecha} → ${fechaFinal ? dayjs(fechaFinal).format('DD/MM/YYYY') : 'INVÁLIDA'}, Recibo: ${numeroRecibo}`);

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
    
    // Resumen final
    console.log(`📊 CSV parseado: ${ventasParsed.length} filas, ${ventasParsed.filter(v => v.Fecha).length} con fecha válida, ${ventasParsed.filter(v => v.NumeroRecibo).length} con recibo`);
    
    return ventasParsed;
  } catch (error) {
    console.error("Error al parsear CSV:", error);
    return [];
  }
};
