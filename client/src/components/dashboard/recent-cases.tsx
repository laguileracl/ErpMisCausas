import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function RecentCases() {
  const { data: recentCases, isLoading } = useQuery({
    queryKey: ["/api/dashboard/recent-cases"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Causas Recientes</CardTitle>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                <div className="grid grid-cols-5 gap-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock recent cases for demonstration
  const mockRecentCases = [
    {
      id: 1,
      rol: "ROL 456-2024",
      court: "3er Juzgado Civil",
      client: "Inversiones del Sur Ltda.",
      type: "Civil",
      status: "En Tramitación",
      nextAction: "Contestar demanda",
    },
    {
      id: 2,
      rol: "ROL 789-2024",
      court: "2do Juzgado Laboral",
      client: "Pedro Martínez",
      type: "Laboral",
      status: "Pendiente",
      nextAction: "Audiencia preparatoria",
    },
    {
      id: 3,
      rol: "ROL 321-2024",
      court: "Tribunal Tributario",
      client: "Comercial Norte S.A.",
      type: "Tributario",
      status: "Activa",
      nextAction: "Respuesta al SII",
    },
  ];

  const cases = recentCases || mockRecentCases;

  const getCaseTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      Civil: "bg-blue-100 text-blue-800",
      Laboral: "bg-purple-100 text-purple-800",
      Tributario: "bg-red-100 text-red-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      "En Tramitación": "bg-green-100 text-green-800",
      "Pendiente": "bg-yellow-100 text-yellow-800",
      "Activa": "bg-green-100 text-green-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-secondary-900">
            Causas Recientes
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-primary-500 hover:text-primary-600">
            Ver todas
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  ROL/RIT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
                  Próxima Acción
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cases.map((caseItem: any) => (
                <tr key={caseItem.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-secondary-900">
                      {caseItem.rol}
                    </div>
                    <div className="text-xs text-secondary-500">{caseItem.court}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-secondary-900">{caseItem.client}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant="secondary" 
                      className={`${getCaseTypeColor(caseItem.type)} border-0`}
                    >
                      {caseItem.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge 
                      variant="secondary" 
                      className={`${getStatusColor(caseItem.status)} border-0`}
                    >
                      {caseItem.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">
                    {caseItem.nextAction}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
