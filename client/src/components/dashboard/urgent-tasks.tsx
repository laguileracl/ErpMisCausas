import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function UrgentTasks() {
  const { data: urgentTasks, isLoading } = useQuery({
    queryKey: ["/api/dashboard/urgent-tasks"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tareas Urgentes</CardTitle>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                <div className="flex items-start space-x-4">
                  <div className="w-2 h-2 bg-gray-200 rounded-full mt-2"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock urgent tasks for demonstration
  const mockUrgentTasks = [
    {
      id: 1,
      title: "Presentar recurso de apelación - Causa ROL 123-2024",
      description: "Tribunal: 3er Juzgado Civil de Santiago",
      dueDate: new Date(),
      priority: "urgent",
      assignee: "María González",
      color: "red",
    },
    {
      id: 2,
      title: "Reunión con cliente - Empresa Constructora ABC",
      description: "Revisión de contratos laborales",
      dueDate: new Date(Date.now() + 86400000), // tomorrow
      priority: "high",
      assignee: "Juan Domínguez",
      color: "yellow",
    },
    {
      id: 3,
      title: "Generar informe pericial - Causa laboral",
      description: "Evaluación de daños por despido injustificado",
      dueDate: new Date(Date.now() + 5 * 86400000), // 5 days
      priority: "medium",
      assignee: "Carlos Mendoza",
      color: "blue",
    },
  ];

  const tasks = urgentTasks || mockUrgentTasks;

  const getTaskColor = (task: any) => {
    const now = new Date();
    if (task.dueDate <= now) return "red";
    if (task.dueDate <= new Date(now.getTime() + 86400000)) return "yellow";
    return "blue";
  };

  const getTaskTimeText = (task: any) => {
    const now = new Date();
    if (task.dueDate <= now) return "Vence hoy";
    if (task.dueDate <= new Date(now.getTime() + 86400000)) return "Mañana 10:00 AM";
    return "15 de Enero";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-secondary-900">
            Tareas Urgentes
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-600">
            Ver todas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task: any) => {
            const color = getTaskColor(task);
            const timeText = getTaskTimeText(task);
            
            return (
              <div
                key={task.id}
                className={`flex items-start space-x-4 p-4 border rounded-lg ${
                  color === "red"
                    ? "bg-red-50 border-red-200"
                    : color === "yellow"
                    ? "bg-yellow-50 border-yellow-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex-shrink-0">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      color === "red"
                        ? "bg-red-500"
                        : color === "yellow"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`}
                  ></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900">{task.title}</p>
                  <p className="text-xs text-secondary-600 mt-1">{task.description}</p>
                  <div className="flex items-center mt-2 space-x-4">
                    <span
                      className={`inline-flex items-center text-xs ${
                        color === "red"
                          ? "text-red-600"
                          : color === "yellow"
                          ? "text-yellow-600"
                          : "text-blue-600"
                      }`}
                    >
                      <i className="fas fa-clock mr-1"></i>
                      {timeText}
                    </span>
                    <span className="text-xs text-secondary-500">
                      Asignado a: {task.assignee}
                    </span>
                  </div>
                </div>
                <button className="flex-shrink-0 text-secondary-400 hover:text-secondary-600">
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
