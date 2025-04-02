
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DateSelector from '@/features/ventas/components/DateSelector';
import FiltersMulti from '@/features/comparacion/components/FiltersMulti';
import FileUploader from '@/features/ventas/components/FileUploader';
import ChartComponent from '@/features/ventas/components/ChartComponent';
import { useSalesData } from '@/features/ventas/hooks/useSalesData';

const CompararRubros = () => {
  const {
    ventas,
    dateRange,
    setDateRange,
    categorias,
    chartData,
    chartOptions,
    handleFileUpload,
    agrupacion,
    setAgrupacion,
    categoriasSeleccionadas,
    setCategoriasSeleccionadas
  } = useSalesData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <aside className="lg:col-span-4 space-y-6">
        <FiltersMulti
          categorias={categorias}
          categoriasSeleccionadas={categoriasSeleccionadas}
          setCategoriasSeleccionadas={setCategoriasSeleccionadas}
          agrupacion={agrupacion}
          setAgrupacion={setAgrupacion}
        />
        
        <Card>
          <CardHeader>
            <CardTitle>Opciones Adicionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FileUploader handleFileUpload={handleFileUpload} />
            <DateSelector dateRange={dateRange} setDateRange={setDateRange} ventas={ventas} />
          </CardContent>
        </Card>
      </aside>
      
      <main className="lg:col-span-8">
        <Card>
          <CardHeader>
            <CardTitle>Comparación de Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartComponent data={chartData} options={chartOptions} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CompararRubros;
