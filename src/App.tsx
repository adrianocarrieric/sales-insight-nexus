
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Topbar from "@/features/topbar/components/Topbar";
import MainPage from "@/pages/MainPage";
import CompararRubros from "@/features/comparacion/pages/CompararRubros";
import NotFound from "@/pages/NotFound";

// Configuración de Chart.js
import { Chart, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(...registerables, annotationPlugin);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Topbar />
          <main className="flex-1 container mx-auto p-4">
            <Routes>
              <Route path="/" element={<MainPage />} />
              <Route path="/comparar" element={<CompararRubros />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
        <Toaster />
        <Sonner />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
