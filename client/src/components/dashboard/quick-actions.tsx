import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuickActionsProps {
  onNewCase: () => void;
}

export function QuickActions({ onNewCase }: QuickActionsProps) {
  const actions = [
    {
      icon: "fas fa-gavel",
      label: "Nueva Causa",
      onClick: onNewCase,
      primary: true,
    },
    {
      icon: "fas fa-user-plus",
      label: "Nuevo Cliente",
      onClick: () => console.log("Nuevo Cliente"),
      primary: false,
    },
    {
      icon: "fas fa-file-alt",
      label: "Generar Documento",
      onClick: () => console.log("Generar Documento"),
      primary: false,
    },
    {
      icon: "fas fa-calendar-plus",
      label: "Programar Tarea",
      onClick: () => console.log("Programar Tarea"),
      primary: false,
    },
    {
      icon: "fas fa-upload",
      label: "Importar Datos",
      onClick: () => console.log("Importar Datos"),
      primary: false,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-secondary-900">
          Acciones Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant="ghost"
            onClick={action.onClick}
            className={`w-full justify-between p-3 h-auto transition-colors ${
              action.primary
                ? "bg-primary-50 hover:bg-primary-100 text-primary-700"
                : "bg-gray-50 hover:bg-gray-100 text-secondary-700"
            }`}
          >
            <div className="flex items-center">
              <i
                className={`${action.icon} mr-3 ${
                  action.primary ? "text-primary-500" : "text-secondary-600"
                }`}
              ></i>
              <span className="text-sm font-medium">{action.label}</span>
            </div>
            <i
              className={`fas fa-chevron-right ${
                action.primary ? "text-primary-500" : "text-secondary-500"
              }`}
            ></i>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
