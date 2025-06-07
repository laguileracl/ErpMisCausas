import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useState } from "react";

interface TopBarProps {
  onNewCase: () => void;
}

export function TopBar({ onNewCase }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const currentDate = new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-secondary-900">Panel de Control</h2>
          <div className="ml-6 flex items-center space-x-4">
            <span className="text-sm text-secondary-600">Hoy:</span>
            <span className="text-sm font-medium text-secondary-900">
              {capitalizeFirst(currentDate)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            onClick={onNewCase}
            className="bg-primary-500 hover:bg-primary-600 text-white"
          >
            <i className="fas fa-plus mr-2"></i>
            Nueva Causa
          </Button>
          
          <NotificationBell />

          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar causas, clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400"></i>
          </div>
        </div>
      </div>
    </header>
  );
}
