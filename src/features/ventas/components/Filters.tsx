
import React from 'react';
import { METRICAS } from '@/features/ui/constants/metricas';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface FiltersProps {
  categoriaSeleccionada: string;
  setCategoriaSeleccionada: (categoria: string) => void;
  productoSeleccionado: string;
  setProductoSeleccionado: (producto: string) => void;
  obtenerProductosUnicos: () => string[];
  categorias: string[];
  agrupacion: string;
  setAgrupacion: (agrupacion: string) => void;
  metricasVisibles: string[];
  setMetricasVisibles: (metricas: string[]) => void;
}

const Filters: React.FC<FiltersProps> = ({
  categoriaSeleccionada,
  setCategoriaSeleccionada,
  productoSeleccionado,
  setProductoSeleccionado,
  obtenerProductosUnicos,
  categorias,
  agrupacion,
  setAgrupacion,
  metricasVisibles,
  setMetricasVisibles
}) => {
  const toggleMetrica = (key: string) => {
    setMetricasVisibles(prev => {
      if (prev.includes(key)) {
        return prev.filter(k => k !== key);
      }
      return [...prev, key];
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría</Label>
          <Select 
            value={categoriaSeleccionada} 
            onValueChange={setCategoriaSeleccionada}
          >
            <SelectTrigger id="categoria">
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas las Categorías">Todas las Categorías</SelectItem>
              {categorias.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="producto">Producto</Label>
          <Select 
            value={productoSeleccionado} 
            onValueChange={setProductoSeleccionado}
          >
            <SelectTrigger id="producto">
              <SelectValue placeholder="Selecciona un producto" />
            </SelectTrigger>
            <SelectContent>
              {obtenerProductosUnicos().map(prod => (
                <SelectItem key={prod} value={prod}>{prod}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="agrupacion">Agrupación</Label>
          <Select 
            value={agrupacion} 
            onValueChange={setAgrupacion}
          >
            <SelectTrigger id="agrupacion">
              <SelectValue placeholder="Selecciona agrupación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mensual">Mensual</SelectItem>
              <SelectItem value="Semanal">Semanal</SelectItem>
              <SelectItem value="Diario">Diario</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Métricas a visualizar</Label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {METRICAS.map(({ key, label }) => (
            <div key={key} className="flex items-center space-x-2">
              <Checkbox 
                id={`metric-${key}`}
                checked={metricasVisibles.includes(key)}
                onCheckedChange={() => toggleMetrica(key)}
              />
              <label 
                htmlFor={`metric-${key}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Filters;
