import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import minMax from 'dayjs/plugin/minMax';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import dayOfYear from 'dayjs/plugin/dayOfYear';
import 'dayjs/locale/es';

import {
  formatIsoWeekKey,
  generarDiasGlobales,
  generarSemanasGlobales,
  generarMesesGlobales,
  parseIsoWeekLabel
} from './dateUtils';

import { METRICAS } from '../../ui/constants/metricas';
import { Venta } from '../hooks/useSalesData';

// Extender dayjs con plugins necesarios
dayjs.locale('es');
dayjs.extend(dayOfYear);
dayjs.extend(isoWeek);
dayjs.extend(minMax);
dayjs.extend(isSameOrBefore);

// Valores de inflación mensual (para ajustes)
const INFLACION_MENSUAL: Record<string, number> = {
  "2022-02": 3.8, "2022-03": 6.7, "2022-04": 6.0, "2022-05": 5.1,
  "2022-06": 5.3, "2022-07": 7.4, "2022-08": 7.0, "2022-09": 6.2,
  "2022-10": 6.3, "2022-11": 4.9, "2022-12": 5.1,

  "2023-01": 6.0, "2023-02": 6.6, "2023-03": 7.7, "2023-04": 8.4,
  "2023-05": 7.8, "2023-06": 6.0, "2023-07": 6.3, "2023-08": 6.9,
  "2023-09": 7.0, "2023-10": 8.3, "2023-11": 12.9, "2023-12": 25.5,

  "2024-01": 20.6, "2024-02": 13.2, "2024-03": 10.9, "2024-04": 8.8,
  "2024-05": 4.2, "2024-06": 4.6, "2024-07": 4.0, "2024-08": 4.2,
  "2024-09": 3.5, "2024-10": 2.7, "2024-11": 2.4, "2024-12": 2.7,

  "2025-01": 2.2, "2025-02": 2.4, "2025-03": 2.5, "2025-04": 2.3,
  "2025-05": 2.3, "2025-06": 2.3, "2025-07": 2.3, "2025-08": 2.3,
  "2025-09": 2.3, "2025-10": 2.3, "2025-11": 2.3, "2025-12": 2.3,

  "2026-01": 1.5, "2026-02": 1.5, "2026-03": 1.5
};

/**
 * Ajusta un valor por la inflación acumulada entre dos fechas
 */
function ajustarPorInflacion(hasta: dayjs.Dayjs, valor: number, desde = dayjs("2022-02")): number {
  let factor = 1;
  let cursor = desde.clone();

  while (cursor.isBefore(hasta, 'month') || cursor.isSame(hasta, 'month')) {
    const clave = cursor.format("YYYY-MM");
    const inflacionMensual = INFLACION_MENSUAL[clave];

    if (inflacionMensual != null) {
      factor *= 1 + (inflacionMensual / 100);
    }

    cursor = cursor.add(1, 'month');
  }

  return valor * factor;
}

/**
 * Agrupa ventas por período de tiempo (día, semana, mes)
 */
function agruparVentasPorTiempo(ventasFiltradas: Venta[], agrupacion: string): Record<string, { articulos: number, recibos: Set<string>, ventasNetas: number, recibosCount: number }> {
  const result: Record<string, { articulos: number, recibos: Set<string>, ventasNetas: number, recibosCount: number }> = {};

  // Contadores para diagnóstico
  let recibosValidos = 0;
  let recibosInvalidos = 0;
  let ventasSinFecha = 0;

  ventasFiltradas.forEach(v => {
    if (!v.Fecha) {
      ventasSinFecha++;
      return; // Omitir ventas sin fecha
    }

    let label: string;
    if (agrupacion === "Mensual") {
      label = dayjs(v.Fecha).format("YYYY-MM");
    } else if (agrupacion === "Semanal") {
      label = formatIsoWeekKey(v.Fecha);
    } else {
      label = dayjs(v.Fecha).format("YYYY-MM-DD");
    }

    if (!result[label]) {
      result[label] = { articulos: 0, recibos: new Set<string>(), ventasNetas: 0, recibosCount: 0 };
    }

    result[label].articulos += v.Cantidad || 0;
    result[label].ventasNetas += v.VentasNetas || 0;

    // Verificación estricta para recibos válidos
    if (v.NumeroRecibo && v.NumeroRecibo.trim() !== '' && v.TipoRecibo !== "Reembolso") {
      result[label].recibos.add(v.NumeroRecibo);
      recibosValidos++;
    } else {
      recibosInvalidos++;
    }
  });

  // Calcular recibosCount a partir del Set de recibos
  Object.keys(result).forEach(lbl => {
    result[lbl].recibosCount = result[lbl].recibos.size;
  });

  return result;
}

/**
 * Obtiene un color de la paleta basado en un índice
 */
function obtenerColor(idx: number): string {
  const colors = [
    'rgba(75, 192, 192, 0.5)',   // celeste
    'rgba(255, 99, 132, 0.5)',   // rosa
    'rgba(153, 102, 255, 0.5)',  // violeta
    'rgba(255, 159, 64, 0.5)',   // naranja
    'rgba(54, 162, 235, 0.5)',   // azul
    'rgba(255, 206, 86, 0.5)',   // amarillo
    'rgba(201, 203, 207, 0.5)',  // gris
  ];
  return colors[idx % colors.length];
}

/**
 * Calcula media móvil para suavizar series de datos
 */
function calcularMediaMovil(data: (number | null)[], windowSize = 3): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.ceil(windowSize / 2));
    const subset = data.slice(start, end).filter((v): v is number => v != null);
    const promedio = subset.length ? subset.reduce((a, b) => a + b, 0) / subset.length : null;
    result.push(promedio);
  }
  return result;
}

/**
 * Calcula tendencias por semana/mes/día para proyecciones
 */
function tendenciaPorSemana(datosPorSemana: Record<string, Record<number, number>>, maxGrowth = 1.3): Record<string, number> {
  const tendencia: Record<string, number> = {};
  for (let periodo in datosPorSemana) {
    const años = Object.keys(datosPorSemana[periodo] || {}).map(Number);
    if (años.length >= 2) {
      años.sort();
      const y1 = datosPorSemana[periodo][años[0]];
      const y2 = datosPorSemana[periodo][años[1]];
      if (y1 && y2) {
        let ratio = y2 / y1;
        if (ratio > maxGrowth) ratio = maxGrowth;
        tendencia[periodo] = ratio;
      }
    }
  }
  return tendencia;
}

/**
 * Genera datos base para proyecciones
 */
function generarProyeccionBase(agrupadas: Record<string, any>, clave: string, agrupacion: string): Record<string | number, Record<number, number>> {
  const datosPorClave: Record<string | number, Record<number, number>> = {};

  for (let lbl in agrupadas) {
    let periodo: string | number;
    if (agrupacion === "Semanal" && lbl.includes("-W")) {
      const [año, semana] = lbl.split("-W").map(Number);
      periodo = semana;
      if (!datosPorClave[periodo]) datosPorClave[periodo] = {};
      datosPorClave[periodo][año] = agrupadas[lbl][clave] || 0;
    } else if (agrupacion === "Mensual") {
      const [año, mes] = lbl.split("-").map(Number);
      periodo = mes;
      if (!datosPorClave[periodo]) datosPorClave[periodo] = {};
      datosPorClave[periodo][año] = agrupadas[lbl][clave] || 0;
    } else if (agrupacion === "Diario") {
      const date = dayjs(lbl);
      const dayOfYear = date.dayOfYear();
      const year = date.year();
      periodo = dayOfYear;
      if (!datosPorClave[periodo]) datosPorClave[periodo] = {};
      datosPorClave[periodo][year] = agrupadas[lbl][clave] || 0;
    }
  }

  return datosPorClave;
}

/**
 * Calcula el valor base para proyecciones
 */
function calcularValorBase(datosPorClave: Record<string | number, Record<number, number>>,
  periodo: string | number,
  año: number,
  tendencia: Record<string, number> = {}): number | null {
  const base = datosPorClave[periodo]?.[año - 1];
  const anterior2 = datosPorClave[periodo]?.[año - 2];

  if (base != null) {
    const tasa = (tendencia[periodo as string]) || 1.1;
    const ratio = anterior2 != null ? Math.min(base / anterior2, 1.3) : tasa;
    return base * ratio;
  }

  return null;
}

/**
 * Genera datos para el gráfico de acuerdo a los filtros
 */
function generateChartData(
  ventas: Venta[],
  categoriaParam: string,
  productoParam: string,
  dateRange: { startDate: Date, endDate: Date, key: string }[],
  agrupacion: string,
  todasCategorias: string[],
  metric: string,
  metricasVisibles: string[] = ["recibosCount", "ventasNetas", "articulos"]
) {
  if (!ventas || ventas.length === 0)
    return { chartData: { labels: [], datasets: [] }, chartOptions: {} };

  const { startDate, endDate } = dateRange[0];
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  const baseTimeLabels = agrupacion === "Mensual"
    ? generarMesesGlobales(start, end)
    : agrupacion === "Semanal"
      ? generarSemanasGlobales(start, end)
      : generarDiasGlobales(start, end);

  let endExtendido = end;
  let timeLabels = baseTimeLabels;

  if (metricasVisibles.includes("proyeccion")) {
    endExtendido = agrupacion === "Semanal"
      ? end.add(52, "week")
      : agrupacion === "Mensual"
        ? end.add(12, "month")
        : end.add(90, "day");

    timeLabels = agrupacion === "Mensual"
      ? generarMesesGlobales(start, endExtendido)
      : agrupacion === "Semanal"
        ? generarSemanasGlobales(start, endExtendido)
        : generarDiasGlobales(start, endExtendido);
  }

  const ventasHistoricas = ventas.filter(v => v.Fecha && dayjs(v.Fecha).isValid());
  const ventasEnRango = ventasHistoricas.filter(v => {
    if (!v.Fecha) return false;
    const fv = dayjs(v.Fecha);
    return fv.isAfter(start.subtract(1, 'day')) && fv.isBefore(endExtendido.add(1, 'day'));
  });

  let datasets = [];

  if (!Array.isArray(categoriaParam)) {
    const ventasFiltradas = ventasEnRango.filter(v =>
      (categoriaParam === "Todas las Categorías" || v.Categoria === categoriaParam) &&
      (productoParam === "Todos los productos" || v.Articulo === productoParam)
    );

    const agrupadas = agruparVentasPorTiempo(ventasFiltradas, agrupacion);

    METRICAS.forEach((met) => {
      if (met.key === "proyeccion") return;

      const metricaKey = met.key === "articulos" ? "articulos" : met.key;

      const data = timeLabels.map(lbl => {
        const valor = agrupadas[lbl]?.[metricaKey] || 0;
        return valor;
      });

      datasets.push({
        label: `${met.label} - ${categoriaParam}`,
        data,
        backgroundColor: obtenerColor(0),
        hidden: !metricasVisibles.includes(met.key),
        stack: met.key
      });
    });
  }

  return { chartData: { labels: timeLabels, datasets }, chartOptions: {} };
}

export {
  obtenerColor,
  agruparVentasPorTiempo,
  calcularMediaMovil,
  parseIsoWeekLabel,
  tendenciaPorSemana,
  calcularValorBase,
  generateChartData
};