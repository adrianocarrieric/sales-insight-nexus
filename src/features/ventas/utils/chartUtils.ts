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
  console.log("Ventas filtradas:", ventasFiltradas.length);
  const result: Record<string, { articulos: number, recibos: Set<string>, ventasNetas: number, recibosCount?: number }> = {};

  ventasFiltradas.forEach(v => {
    if (!v.Fecha) return;
    console.log("Procesando venta:", { fecha: v.Fecha, recibo: v.NumeroRecibo, tipo: v.TipoRecibo });

    let label: string;
    if (agrupacion === "Mensual") {
      label = dayjs(v.Fecha).format("YYYY-MM");
    } else if (agrupacion === "Semanal") {
      label = formatIsoWeekKey(v.Fecha);
    } else {
      label = dayjs(v.Fecha).format("YYYY-MM-DD");
    }

    if (!result[label]) {
      result[label] = { articulos: 0, recibos: new Set(), ventasNetas: 0 };
    }

    result[label].articulos += v.Cantidad || 0;
    result[label].ventasNetas += v.VentasNetas || 0;

    // Solo agregamos el recibo si no es reembolso y tiene número válido
    if (v.TipoRecibo !== "Reembolso" && v.NumeroRecibo && v.NumeroRecibo.trim() !== '') {
      // Limpiamos el número de recibo de espacios
      const reciboLimpio = v.NumeroRecibo.trim();
      result[label].recibos.add(reciboLimpio);
      console.log(`Agregando recibo ${reciboLimpio} a ${label}`);
    }
  });

  // Calcular recibosCount una sola vez usando el Set de recibos únicos
  Object.keys(result).forEach(lbl => {
    result[lbl].recibosCount = result[lbl].recibos.size;
    console.log(`${lbl}: ${result[lbl].recibosCount} recibos únicos`);
  });

  return result as Record<string, { articulos: number, recibos: Set<string>, ventasNetas: number, recibosCount: number }>;
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
 * Genera datos para el gráfico de acuerdo a los filtros
 */
export function generateChartData(
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

  let yearChangeLines = [];

  const individualMode = !Array.isArray(categoriaParam);
  const { startDate, endDate } = dateRange[0];
  const start = dayjs(startDate);
  const end = dayjs(endDate);

  // Generar etiquetas de tiempo para el rango de fechas
  const baseTimeLabels = agrupacion === "Mensual"
    ? generarMesesGlobales(start, end)
    : agrupacion === "Semanal"
      ? generarSemanasGlobales(start, end)
      : generarDiasGlobales(start, end);

  let endExtendido = end;
  let timeLabels = baseTimeLabels;

  // Extender el rango si se incluye proyección
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

  // Filtrar ventas históricas y en rango
  const ventasHistoricas = ventas.filter(v => v.Fecha && dayjs(v.Fecha).isValid());

  const ventasEnRango = ventasHistoricas.filter(v => {
    if (!v.Fecha) return false;
    const fv = dayjs(v.Fecha);
    return fv.isAfter(start.subtract(1, 'day')) && fv.isBefore(endExtendido.add(1, 'day'));
  });

  // Arreglo para almacenar los datasets del gráfico
  let datasets = [];

  if (individualMode) {
    // Filtrar ventas según categoría y producto seleccionados
    const ventasFiltradas = ventasEnRango.filter(v =>
      (categoriaParam === "Todas las Categorías" || v.Categoria === categoriaParam) &&
      (productoParam === "Todos los productos" || v.Articulo === productoParam)
    );

    // Agrupar datos para mostrar en el gráfico
    const agrupadas = agruparVentasPorTiempo(ventasFiltradas, agrupacion);

    // Agrupar todo el historial para proyecciones
    const agrupadasHistorialCompleto = agruparVentasPorTiempo(
      ventasHistoricas.filter(v =>
        (categoriaParam === "Todas las Categorías" || v.Categoria === categoriaParam) &&
        (productoParam === "Todos los productos" || v.Articulo === productoParam)
      ),
      agrupacion
    );

    // Colores fijos para las métricas principales
    const coloresFijos = {
      articulos: 'rgba(75, 192, 192, 0.5)',      // celeste
      recibosCount: 'rgba(255, 99, 132, 0.5)',   // rosa
      ventasNetas: 'rgba(153, 102, 255, 0.5)',   // violeta
    };

    // Crear datasets para cada métrica seleccionada
    METRICAS.forEach((met) => {
      if (met.key === "proyeccion") return;

      const data = timeLabels.map(lbl => agrupadas[lbl]?.[met.key] || 0);

      datasets.push({
        label: `${met.label} - ${categoriaParam}`,
        data,
        backgroundColor: coloresFijos[met.key as keyof typeof coloresFijos] || obtenerColor(0),
        hidden: !metricasVisibles.includes(met.key),
        stack: met.key
      });
    });

    // Agregar proyecciones si están habilitadas
    if (metricasVisibles.includes("proyeccion")) {
      const clavesProyectadas = metricasVisibles.filter(m => m !== "proyeccion");

      clavesProyectadas.forEach((clave) => {
        const datosPorClave = generarProyeccionBase(agrupadasHistorialCompleto, clave, agrupacion);
        const tendencia = tendenciaPorSemana(datosPorClave);

        const generarGlobales = agrupacion === "Mensual" ? generarMesesGlobales : agrupacion === "Semanal" ? generarSemanasGlobales : generarDiasGlobales;
        const parsearFecha = agrupacion === "Semanal" ? parseIsoWeekLabel : (lbl: string) => dayjs(lbl);

        const allLabels = generarGlobales(start, endExtendido);
        const proyeccionData = allLabels.map(label => {
          const date = parsearFecha(label);
          const periodo = agrupacion === "Semanal"
            ? date.isoWeek()
            : agrupacion === "Mensual"
              ? date.month() + 1
              : date.dayOfYear();
          const año = date.year();

          let valor: number | null = null;

          if (clave === "ventasNetas") {
            const base = datosPorClave[periodo]?.[año - 1];
            const anterior2 = datosPorClave[periodo]?.[año - 2];

            if (base != null) {
              const ratio = anterior2 != null ? Math.min(base / anterior2, 1.3) : 1.1; // 10% de crecimiento si no hay anterior2
              valor = base * ratio;
              const desde = dayjs().year(año - 1).month(date.month());
              valor = ajustarPorInflacion(date, valor, desde);
            }
          } else {
            const base = datosPorClave[periodo]?.[año - 1];
            const anterior2 = datosPorClave[periodo]?.[año - 2];
            const ratio = anterior2 != null ? (tendencia[periodo] || 1) : 1.1; // 10% por defecto
            valor = base != null ? base * ratio : null;
          }

          if (valor != null) {
            valor = Math.round(valor);
          }
          return valor;
        });

        // Suavizar proyección con media móvil
        const proyeccionSuavizada = calcularMediaMovil(proyeccionData, 3).map(v => v != null ? Math.round(v) : null);

        // Encontrar el punto donde comienza la proyección
        const ultimoLabelReal = baseTimeLabels[baseTimeLabels.length - 1];
        const inicioProyeccionIndex = allLabels.findIndex(lbl => lbl === ultimoLabelReal) + 1;

        // Crear dataset para barras proyectadas (solo mostrar en el futuro)
        const barrasProyectadas = allLabels.map((lbl, i) => {
          return i < inicioProyeccionIndex ? null : proyeccionSuavizada[i];
        });

        // Agregar dataset para barras proyectadas
        datasets.push({
          label: `🟪 Proyección Barras - ${clave}`,
          data: barrasProyectadas,
          backgroundColor: "rgba(180, 180, 180, 0.25)",
          borderSkipped: false,
          type: "bar",
          barPercentage: 0.8,
          categoryPercentage: 0.9,
          stack: undefined
        });

        // Agregar dataset para línea de proyección
        datasets.push({
          label: `📈 Proyección Estacional - ${clave}`,
          data: proyeccionSuavizada,
          borderColor: "rgb(124, 124, 124)",
          borderWidth: 2,
          backgroundColor: "transparent",
          borderDash: [5, 5],
          type: "line",
          tension: 0.3,
          pointRadius: 0
        });

        // Actualizar etiquetas de tiempo para incluir proyección
        timeLabels = Array.from(new Set([...timeLabels, ...allLabels]));
      });
    }

    // Agregar líneas verticales para cambios de año
    yearChangeLines = [];
    let lastYear = null;
    timeLabels.forEach((label) => {
      const currentDate = agrupacion === "Semanal" ? parseIsoWeekLabel(label) : dayjs(label);
      const currentYear = currentDate.year();
      if (lastYear !== null && currentYear !== lastYear) {
        yearChangeLines.push({
          type: 'line',
          scaleID: 'x',
          value: label,
          borderColor: 'gray',
          borderDash: [6, 6],
          borderWidth: 1,
          label: {
            display: true,
            content: `Año ${currentYear}`,
            position: 'start'
          }
        });
      }
      lastYear = currentYear;
    });
  }

  // Configurar opciones del gráfico
  return {
    chartData: { labels: timeLabels, datasets },
    chartOptions: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        annotation: { annotations: yearChangeLines },
        tooltip: {
          callbacks: {
            title: (tooltipItems: any) => {
              const lbl = tooltipItems[0].label;
              if (agrupacion === "Semanal") {
                const [yearStr, weekStr] = lbl.split('-W');
                const year = parseInt(yearStr, 10);
                const week = parseInt(weekStr, 10);
                const startOfWeek = dayjs().year(year).isoWeek(week).startOf('isoWeek');
                const endOfWeek = dayjs().year(year).isoWeek(week).endOf('isoWeek');
                return `Semana del ${startOfWeek.format('DD/MM/YYYY')} al ${endOfWeek.format('DD/MM/YYYY')}`;
              } else if (agrupacion === "Mensual") {
                const [year, month] = lbl.split('-');
                const startOfMonth = dayjs(`${year}-${month}-01`).startOf('month');
                const endOfMonth = dayjs(`${year}-${month}-01`).endOf('month');
                return `Mes del ${startOfMonth.format('DD/MM/YYYY')} al ${endOfMonth.format('DD/MM/YYYY')}`;
              } else {
                return `Día: ${dayjs(lbl, "YYYY-MM-DD").format('DD/MM/YYYY')}`;
              }
            },
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = context.raw;

              const esVenta = label.toLowerCase().includes("ventasnetas");

              if (value == null) return null;
              return esVenta
                ? `${label}: $${value.toLocaleString("es-AR")}`
                : `${label}: ${value.toLocaleString("es-AR")}`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'category',
          grid: { display: false },
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 45,
            font: {
              size: 9
            },
            callback: function(value: any, index: number, values: any[]) {
              const label = this.getLabelForValue(value);
              let date;
              if (agrupacion === "Semanal" && typeof label === "string" && label.includes("-W")) {
                date = parseIsoWeekLabel(label);
              } else {
                date = dayjs(label);
              }

              if (!date.isValid()) return "";

              // Mostrar solo si es el primer label o si cambió el mes
              if (index === 0) {
                return date.format("MMM").toUpperCase();
              }

              const prevLabel = this.getLabelForValue(values[index - 1].value);
              let prevDate;
              if (agrupacion === "Semanal" && prevLabel.includes("-W")) {
                prevDate = parseIsoWeekLabel(prevLabel);
              } else {
                prevDate = dayjs(prevLabel);
              }

              const mismoMes = prevDate.isValid() && prevDate.month() === date.month() && prevDate.year() === date.year();

              return mismoMes ? "" : date.format("MMM").toUpperCase();
            }
          }
        },
        y: { beginAtZero: true }
      }
    }
  };
}