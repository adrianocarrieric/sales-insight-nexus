
import React from 'react';
import { Bar } from 'react-chartjs-2';
import { ChartData, ChartOptions } from 'chart.js';

interface ChartComponentProps {
  data: ChartData<"bar", number[], string>;
  options: ChartOptions<"bar">;
}

const ChartComponent: React.FC<ChartComponentProps> = ({ data, options }) => {
  if (!data || !data.labels || data.labels.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 border rounded-lg bg-gray-50">
        <p className="text-gray-500">Cargando datos del gráfico...</p>
      </div>
    );
  }
  
  return (
    <div className="chart-container w-full h-[700px] border border-gray-200 rounded-lg overflow-hidden">
      <Bar data={data} options={options} />
    </div>
  );
};

export default ChartComponent;
