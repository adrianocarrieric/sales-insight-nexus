
import { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import { parseCSVData } from "../utils/csvUtils";
import { generateChartData } from "../utils/chartUtils";
import { toast } from "@/components/ui/use-toast";

// Define global window for Electron API
declare global {
  interface Window {
    electronAPI?: {
      getFilePath: (defaultName: string) => string;
      readFile: (path: string) => Promise<string>;
    };
  }
}

// Verificar si estamos en un entorno Electron
const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

export interface Venta {
  Fecha: Date | null;
  NumeroRecibo: string;
  TipoRecibo: string;
  Categoria: string;
  REF: string;
  Articulo: string;
  Cantidad: number;
  VentasNetas: number;
}

export function useSalesData() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);
  // Para vista individual:
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>("Todas las Categorías");
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>("Todos los productos");
  // Para comparación (multi-select):
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([]);
  const [metricaSeleccionada, setMetricaSeleccionada] = useState<string>("Recibos");

  const [dateRange, setDateRange] = useState([
    { startDate: new Date(2000, 0, 1), endDate: new Date(), key: "selection" }
  ]);
  const [chartData, setChartData] = useState<any>({ labels: [], datasets: [] });
  const [chartOptions, setChartOptions] = useState<any>({});
  const [agrupacion, setAgrupacion] = useState<string>("Semanal");
  const [metricasVisibles, setMetricasVisibles] = useState<string[]>(["recibosCount"]);

  const dataLoaded = useRef(false);

  // Cargar datos iniciales del CSV
  useEffect(() => {
    if (dataLoaded.current) return;
    dataLoaded.current = true;

    const cargarDatosMock = () => {
      // Crear datos de ejemplo si no hay archivo CSV o no estamos en producción
      const hoy = new Date();
      const datosEjemplo: Venta[] = [];
      
      // Crear algunas categorías para simular datos
      const categoriasEjemplo = ["Electrónica", "Ropa", "Alimentos", "Hogar"];
      const productosEjemplo = {
        "Electrónica": ["Smartphone", "Laptop", "Tablet", "TV"],
        "Ropa": ["Camiseta", "Pantalón", "Vestido", "Zapatos"],
        "Alimentos": ["Frutas", "Lácteos", "Carnes", "Verduras"],
        "Hogar": ["Sillón", "Mesa", "Lámpara", "Cama"]
      };
      
      // Generar datos para los últimos 6 meses
      for (let i = 0; i < 180; i++) {
        const fecha = new Date(hoy);
        fecha.setDate(fecha.getDate() - i);
        
        // Entre 1 y 5 ventas por día para cada categoría
        categoriasEjemplo.forEach(categoria => {
          const numVentas = Math.floor(Math.random() * 5) + 1;
          
          for (let j = 0; j < numVentas; j++) {
            const productos = productosEjemplo[categoria as keyof typeof productosEjemplo];
            const producto = productos[Math.floor(Math.random() * productos.length)];
            const cantidad = Math.floor(Math.random() * 5) + 1;
            const valorUnitario = Math.floor(Math.random() * 1000) + 100;
            
            datosEjemplo.push({
              Fecha: fecha,
              NumeroRecibo: `REC-${Math.floor(Math.random() * 10000)}`,
              TipoRecibo: "Venta",
              Categoria: categoria,
              REF: `REF-${Math.floor(Math.random() * 1000)}`,
              Articulo: producto,
              Cantidad: cantidad,
              VentasNetas: cantidad * valorUnitario
            });
          }
        });
      }
      
      procesarCSV(datosEjemplo);
      toast({
        title: "Datos de ejemplo cargados",
        description: "Se han cargado datos de ejemplo para demostración.",
      });
    };

    // Iniciar carga de datos
    if (isElectron && window.electronAPI?.getFilePath) {
      const csvPath = window.electronAPI.getFilePath("data_inicial.csv");
      window.electronAPI.readFile(csvPath)
        .then((data: string) => procesarCSV(parseCSVData(data)))
        .catch((err: Error) => {
          console.error("Error al cargar CSV en Electron:", err);
          cargarDatosMock();
        });
    } else {
      fetch("/data_inicial.csv")
        .then(res => {
          if (!res.ok) throw new Error("No se encontró el archivo CSV");
          return res.text();
        })
        .then(text => procesarCSV(parseCSVData(text)))
        .catch(err => {
          console.error("Error al cargar CSV:", err);
          cargarDatosMock();
        });
    }
  }, []);

  function procesarCSV(parsedData: Venta[]) {
    if (!parsedData || parsedData.length === 0) {
      console.warn("El archivo CSV está vacío o con errores.");
      return;
    }
    setVentas(parsedData);
    const cats = Array.from(new Set(parsedData.map(v => v.Categoria).filter(Boolean)));
    cats.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
    setCategorias(cats);
  }

  // Configurar el rango de fechas global basado en los datos
  useEffect(() => {
    if (ventas.length === 0) return;
    
    const fechasValidas = ventas
      .map(v => v.Fecha ? dayjs(v.Fecha) : null)
      .filter((d): d is dayjs.Dayjs => d !== null && d.isValid());
    
    if (fechasValidas.length === 0) return;
    
    const globalStart = fechasValidas.reduce((min, date) => 
      date.isBefore(min) ? date : min, fechasValidas[0]);
    
    const globalEnd = fechasValidas.reduce((max, date) => 
      date.isAfter(max) ? date : max, fechasValidas[0]);
    
    if (globalStart.isValid() && globalEnd.isValid()) {
      setDateRange([{
        startDate: globalStart.toDate(),
        endDate: globalEnd.toDate(),
        key: "selection"
      }]);
    }
  }, [ventas]);

  // Generar datos para el gráfico
  useEffect(() => {
    if (ventas.length === 0) return;
    
    const { chartData, chartOptions } = generateChartData(
      ventas,
      categoriaSeleccionada,
      productoSeleccionado,
      dateRange,
      agrupacion,
      categorias,
      metricaSeleccionada,
      metricasVisibles
    );
    
    setChartData(chartData);
    setChartOptions(chartOptions);
  }, [
    ventas,
    categoriaSeleccionada,
    productoSeleccionado,
    dateRange,
    agrupacion,
    categorias,
    metricaSeleccionada,
    metricasVisibles,
    categoriasSeleccionadas
  ]);

  // Manejar la carga de archivos CSV
  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== 'string') {
        toast({
          title: "Error",
          description: "No se pudo leer el archivo CSV.",
          variant: "destructive"
        });
        return;
      }
      
      const parsedData = parseCSVData(result);
      if (!parsedData || parsedData.length === 0) {
        toast({
          title: "Error",
          description: "El CSV no contiene datos válidos.",
          variant: "destructive"
        });
        return;
      }
      
      setVentas(prev => [...prev, ...parsedData]);
      
      const nuevosCats = Array.from(new Set([
        ...categorias,
        ...parsedData.map(v => v.Categoria).filter(Boolean)
      ]));
      
      nuevosCats.sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
      setCategorias(nuevosCats);
      
      toast({
        title: "Archivo cargado",
        description: `Se han añadido ${parsedData.length} registros de ventas.`,
      });
    };
    
    reader.readAsText(file);
  }

  return {
    ventas,
    categorias,
    categoriaSeleccionada,
    setCategoriaSeleccionada,
    productoSeleccionado,
    setProductoSeleccionado,
    categoriasSeleccionadas,
    setCategoriasSeleccionadas,
    dateRange,
    setDateRange,
    chartData,
    chartOptions,
    agrupacion,
    setAgrupacion,
    handleFileUpload,
    metricaSeleccionada,
    setMetricaSeleccionada,
    metricasVisibles,
    setMetricasVisibles,
    // Función para obtener productos filtrados según la categoría individual:
    obtenerProductosUnicos: () => {
      let filtradas = ventas;
      if (categoriaSeleccionada !== "Todas las Categorías") {
        filtradas = filtradas.filter(v => v.Categoria === categoriaSeleccionada);
      }
      const productosUnicos = Array.from(new Set(filtradas.map(v => v.Articulo).filter(Boolean)));
      productosUnicos.sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
      return ["Todos los productos", ...productosUnicos];
    }
  };
}
