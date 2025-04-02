
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface FiltersMultiProps {
  categorias: string[];
  categoriasSeleccionadas: string[];
  setCategoriasSeleccionadas: (categorias: string[]) => void;
  agrupacion: string;
  setAgrupacion: (agrupacion: string) => void;
}

const FiltersMulti: React.FC<FiltersMultiProps> = ({
  categorias,
  categoriasSeleccionadas,
  setCategoriasSeleccionadas,
  agrupacion,
  setAgrupacion
}) => {
  const toggleCategoria = (categoria: string) => {
    setCategoriasSeleccionadas(
      categoriasSeleccionadas.includes(categoria)
        ? categoriasSeleccionadas.filter(c => c !== categoria)
        : [...categoriasSeleccionadas, categoria]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros de Comparación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Categorías</Label>
          <div className="max-h-96 overflow-y-auto border rounded-md p-3 space-y-2">
            {categorias.map(cat => (
              <div key={cat} className="flex items-center space-x-2">
                <Checkbox 
                  id={`cat-${cat}`}
                  checked={categoriasSeleccionadas.includes(cat)}
                  onCheckedChange={() => toggleCategoria(cat)}
                />
                <label
                  htmlFor={`cat-${cat}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {cat}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="agrupacion">Agrupación de Fechas</Label>
          <Select value={agrupacion} onValueChange={setAgrupacion}>
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
      </CardContent>
    </Card>
  );
};

export default FiltersMulti;
