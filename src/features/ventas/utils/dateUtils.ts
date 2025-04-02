
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import dayOfYear from 'dayjs/plugin/dayOfYear';

// Extender dayjs con plugins necesarios
dayjs.extend(isoWeek);
dayjs.extend(dayOfYear);

/**
 * Formatea una fecha en formato de semana ISO (YYYY-Www)
 */
export const formatIsoWeekKey = (fecha: Date | string | null): string => {
  if (!fecha) return '';
  
  const d = dayjs(fecha);
  if (!d.isValid()) return '';
  
  const isoYear = d.isoWeekYear();
  const isoWeekNumber = String(d.isoWeek()).padStart(2, '0');
  return `${isoYear}-W${isoWeekNumber}`;
};

/**
 * Genera un array de claves de meses entre dos fechas
 */
export function generarMesesGlobales(minDate: dayjs.Dayjs, maxDate: dayjs.Dayjs): string[] {
  const meses: string[] = [];
  let current = minDate.startOf('month');
  
  while (current.isBefore(maxDate) || current.isSame(maxDate, 'month')) {
    meses.push(current.format('YYYY-MM'));
    current = current.add(1, 'month');
  }
  
  return meses;
}

/**
 * Genera un array de claves de semanas ISO entre dos fechas
 */
export function generarSemanasGlobales(minDate: dayjs.Dayjs, maxDate: dayjs.Dayjs): string[] {
  const semanas: string[] = [];
  let current = minDate.startOf('isoWeek');
  const finalWeek = maxDate.endOf('isoWeek');
  
  while (current.isBefore(finalWeek) || current.isSame(finalWeek, 'week')) {
    semanas.push(formatIsoWeekKey(current.toDate()));
    current = current.add(1, 'week');
  }
  
  return semanas;
}

/**
 * Genera un array de claves de días entre dos fechas
 */
export function generarDiasGlobales(minDate: dayjs.Dayjs, maxDate: dayjs.Dayjs): string[] {
  const dias: string[] = [];
  let current = minDate.startOf('day');
  
  while (current.isBefore(maxDate) || current.isSame(maxDate, 'day')) {
    dias.push(current.format('YYYY-MM-DD'));
    current = current.add(1, 'day');
  }
  
  return dias;
}

/**
 * Parsea una etiqueta de semana ISO para convertirla en un objeto dayjs
 */
export function parseIsoWeekLabel(label: string): dayjs.Dayjs {
  const [year, week] = label.split('-W');
  return dayjs().year(parseInt(year)).isoWeek(parseInt(week));
}
