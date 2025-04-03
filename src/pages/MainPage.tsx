
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DateSelector from '@/features/ventas/components/DateSelector';
import Filters from '@/features/ventas/components/Filters';
import FileUploader from '@/features/ventas/components/FileUploader';
import ChartComponent from '@/features/ventas/components/ChartComponent';
import { useSalesData } from '@/features/ventas/hooks/useSalesData';

const MainPage = () => {
  const {
    ventas,
    dateRange,
    setDateRange,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    productoSeleccionado,
    setProductoSeleccionado,
    obtenerProductosUnicos,
    categorias,
    chartData,
    chartOptions,
    handleFileUpload,
    agrupacion,
    setAgrupacion,
    metricasVisibles,
    setMetricasVisibles
  } = useSalesData();

  // Add debug logging
  useEffect(() => {
    if (chartData && chartData.datasets && chartData.datasets.length > 0) {
      console.log("Chart datasets:", chartData.datasets);
      // Log receipt count dataset if it exists
      const recibosDataset = chartData.datasets.find(ds => ds.label && ds.label.includes("Recibos"));
      if (recibosDataset) {
        console.log("Recibos dataset:", recibosDataset);
      } else {
        console.log("No receipts dataset found");
      }
    }
  }, [chartData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Análisis de Ventas por Categoría</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Filtros de análisis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <DateSelector 
            dateRange={dateRange} 
            setDateRange={setDateRange} 
            ventas={ventas} 
          />
          <Filters
            categoriaSeleccionada={categoriaSeleccionada}
            setCategoriaSeleccionada={setCategoriaSeleccionada}
            productoSeleccionado={productoSeleccionado}
            setProductoSeleccionado={setProductoSeleccionado}
            obtenerProductosUnicos={obtenerProductosUnicos}
            categorias={categorias}
            agrupacion={agrupacion}
            setAgrupacion={setAgrupacion}
            metricasVisibles={metricasVisibles}
            setMetricasVisibles={setMetricasVisibles}
          />
          <FileUploader handleFileUpload={handleFileUpload} />
        </CardContent>
      </Card>
      
      <Card className="bg-white">
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartComponent data={chartData} options={chartOptions} />
        </CardContent>
      </Card>
    </div>
  );
};

export default MainPage;
