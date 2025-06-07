import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="ml-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-6 bg-gray-200 rounded w-12"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      icon: "fas fa-gavel",
      iconBg: "bg-primary-50",
      iconColor: "text-primary-500",
      label: "Causas Activas",
      value: stats?.activeCases || 0,
      trend: "+2 esta semana",
      trendColor: "text-green-600",
    },
    {
      icon: "fas fa-clock",
      iconBg: "bg-orange-50",
      iconColor: "text-orange-500",
      label: "Tareas Pendientes",
      value: stats?.pendingTasks || 0,
      trend: `${stats?.overdueTasks || 0} vencidas`,
      trendColor: "text-red-600",
    },
    {
      icon: "fas fa-users",
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
      label: "Clientes Activos",
      value: stats?.activeClients || 0,
      trend: `+${stats?.newClientsThisMonth || 0} este mes`,
      trendColor: "text-green-600",
    },
    {
      icon: "fas fa-file-alt",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      label: "Documentos Generados",
      value: stats?.documentsThisMonth || 0,
      trend: "12 esta semana",
      trendColor: "text-secondary-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <Card 
          key={index} 
          className="hover:shadow-lg transition-shadow duration-300 cursor-pointer"
        >
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                  <i className={`${stat.icon} ${stat.iconColor}`}></i>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary-600">{stat.label}</p>
                <p className="text-2xl font-bold text-secondary-900">{stat.value}</p>
                <p className={`text-xs ${stat.trendColor}`}>{stat.trend}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
