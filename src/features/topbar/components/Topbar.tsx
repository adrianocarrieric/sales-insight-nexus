
import React from "react";
import { Link } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation } from "react-router-dom";

const Topbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <header className="border-b sticky top-0 z-10 bg-white">
      <div className="container mx-auto py-3 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Sales Insight Nexus</h1>
        
        <Tabs defaultValue={currentPath} className="w-auto">
          <TabsList>
            <TabsTrigger value="/" asChild>
              <Link to="/">Individual</Link>
            </TabsTrigger>
            <TabsTrigger value="/comparar" asChild>
              <Link to="/comparar">Comparar Rubros</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
};

export default Topbar;
