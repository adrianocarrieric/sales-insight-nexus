
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
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
    setCategoriasSeleccionadas(prev => 
      prev.includes(categoria)
        ? prev.filter(c => c !== categoria)
        : [...prev, categoria]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros de Comparación</CardTitle>
        <CardDescription>
          Selecciona las categorías a comparar y ajusta la agrupación temporal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Categorías</Label>
          <ScrollArea className="h-80 border rounded-md p-2">
            <div className="space-y-2">
              {categorias.map((cat) => (
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
          </ScrollArea>
          <p className="text-sm text-muted-foreground mt-2">
            {categoriasSeleccionadas.length} categorías seleccionadas
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="agrupacion-comp">Agrupación de Fechas</Label>
          <Select 
            value={agrupacion} 
            onValueChange={setAgrupacion}
          >
            <SelectTrigger id="agrupacion-comp" className="w-full">
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
