import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SystemStatus() {
  const statusItems = [
    {
      name: "Base de Datos",
      status: "online",
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      name: "Servidor de Documentos",
      status: "online",
      color: "bg-green-500",
      textColor: "text-green-600",
    },
    {
      name: "Backup Automático",
      status: "pending",
      color: "bg-yellow-500",
      textColor: "text-yellow-600",
    },
  ];

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      online: "Online",
      pending: "Pendiente",
      offline: "Offline",
    };
    return statusMap[status] || status;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-secondary-900">
          Estado del Sistema
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusItems.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`w-2 h-2 ${item.color} rounded-full mr-3`}></div>
              <span className="text-sm text-secondary-600">{item.name}</span>
            </div>
            <span className={`text-xs font-medium ${item.textColor}`}>
              {getStatusText(item.status)}
            </span>
          </div>
        ))}

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-secondary-500">Último respaldo: Ayer 23:30</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 p-0 h-auto text-xs text-primary-500 hover:text-primary-600 font-medium"
          >
            Ver logs del sistema
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
