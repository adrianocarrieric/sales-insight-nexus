
import React, { useState, useEffect } from 'react';
import { DateRange, DefinedRange } from 'react-date-range';
import dayjs from 'dayjs';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CalendarIcon } from 'lucide-react';

interface DateSelectorProps {
  dateRange: {
    startDate: Date;
    endDate: Date;
    key: string;
  }[];
  setDateRange: React.Dispatch<React.SetStateAction<{
    startDate: Date;
    endDate: Date;
    key: string;
  }[]>>;
  ventas: any[];
}

const DateSelector: React.FC<DateSelectorProps> = ({ dateRange, setDateRange, ventas }) => {
  const [showCalendar, setShowCalendar] = useState(false);

  const staticRanges = [
    {
      label: 'Última Semana',
      range: () => ({ 
        startDate: dayjs().subtract(7, 'days').toDate(), 
        endDate: new Date() 
      }),
      isSelected: (range: any) => dayjs(range.startDate).isSame(dayjs().subtract(7, 'days'), 'day'),
    },
    {
      label: 'Último Mes',
      range: () => ({ 
        startDate: dayjs().subtract(1, 'month').toDate(), 
        endDate: new Date() 
      }),
      isSelected: (range: any) => dayjs(range.startDate).isSame(dayjs().subtract(1, 'month'), 'day'),
    },
    {
      label: 'Últimos 6 meses',
      range: () => ({ 
        startDate: dayjs().subtract(6, 'month').toDate(), 
        endDate: new Date() 
      }),
      isSelected: (range: any) => dayjs(range.startDate).isSame(dayjs().subtract(6, 'month'), 'day'),
    },
    {
      label: 'Último año',
      range: () => ({ 
        startDate: dayjs().subtract(1, 'year').toDate(), 
        endDate: new Date() 
      }),
      isSelected: (range: any) => dayjs(range.startDate).isSame(dayjs().subtract(1, 'year'), 'day'),
    },
    {
      label: 'Siempre',
      range: () => {
        if (ventas.length === 0) return { startDate: new Date(), endDate: new Date() };
        const fechas = ventas.map(v => dayjs(v.Fecha)).filter(d => d.isValid());
        
        if (fechas.length === 0) return { startDate: new Date(), endDate: new Date() };
        
        const minDate = fechas.reduce((min, date) => 
          date.isBefore(min) ? date : min, fechas[0]);
        
        const maxDate = fechas.reduce((max, date) => 
          date.isAfter(max) ? date : max, fechas[0]);
        
        return {
          startDate: minDate.toDate(),
          endDate: maxDate.toDate(),
        };
      },
      isSelected: () => true,
    },
  ];

  useEffect(() => {
    if (ventas.length > 0) {
      const siempreRange = staticRanges[4].range();
      setDateRange([{ ...siempreRange, key: 'selection' }]);
    }
  }, [ventas, setDateRange]);

  return (
    <div className="date-selector space-y-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline"
          onClick={() => setShowCalendar(!showCalendar)}
          className="flex gap-2 items-center"
        >
          <CalendarIcon className="h-4 w-4" />
          {showCalendar ? 'Cerrar calendario' : 'Seleccionar rango de fechas'}
        </Button>
        
        <span className="text-sm text-muted-foreground">
          {dayjs(dateRange[0]?.startDate).format('DD/MM/YYYY')} - {dayjs(dateRange[0]?.endDate).format('DD/MM/YYYY')}
        </span>
      </div>

      {showCalendar && (
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <DateRange
              onChange={(ranges) => setDateRange([ranges.selection])}
              moveRangeOnFirstSelection={false}
              ranges={dateRange}
              editableDateInputs
              dateDisplayFormat="dd/MM/yyyy"
              maxDate={new Date()}
              className="border rounded shadow-sm"
            />
            <DefinedRange
              onChange={(ranges) => setDateRange([ranges.selection])}
              staticRanges={staticRanges}
              inputRanges={[]}
              ranges={dateRange}
              maxDate={new Date()}
            />
          </div>
        </Card>
      )}
    </div>
  );
};

export default DateSelector;
