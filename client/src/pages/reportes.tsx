import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Calendar, FileText, AlertTriangle, Users, Building, Gavel, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function ReportesPage() {
  // Fetch reports data
  const { data: casesByType } = useQuery({
    queryKey: ['/api/reports/cases-by-type'],
    queryFn: async () => {
      const response = await fetch('/api/reports/cases-by-type');
      if (!response.ok) throw new Error('Failed to fetch cases by type');
      return response.json();
    }
  });

  const { data: casesByCourt } = useQuery({
    queryKey: ['/api/reports/cases-by-court'],
    queryFn: async () => {
      const response = await fetch('/api/reports/cases-by-court');
      if (!response.ok) throw new Error('Failed to fetch cases by court');
      return response.json();
    }
  });

  const { data: upcomingTasks } = useQuery({
    queryKey: ['/api/reports/upcoming-tasks'],
    queryFn: async () => {
      const response = await fetch('/api/reports/upcoming-tasks');
      if (!response.ok) throw new Error('Failed to fetch upcoming tasks');
      return response.json();
    }
  });

  const { data: documentsByMonth } = useQuery({
    queryKey: ['/api/reports/documents-by-month'],
    queryFn: async () => {
      const response = await fetch('/api/reports/documents-by-month');
      if (!response.ok) throw new Error('Failed to fetch documents by month');
      return response.json();
    }
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/reports/dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/reports/dashboard-stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    }
  });

  // Transform data for charts
  const caseTypeData = casesByType ? Object.entries(casesByType).map(([name, value]) => ({
    name,
    value: Number(value),
    fill: COLORS[Object.keys(casesByType).indexOf(name) % COLORS.length]
  })) : [];

  const courtData = casesByCourt ? Object.entries(casesByCourt).map(([name, value]) => ({
    name: name.length > 15 ? name.substring(0, 15) + '...' : name,
    fullName: name,
    value: Number(value)
  })) : [];

  const documentsData = documentsByMonth ? Object.entries(documentsByMonth).map(([month, count]) => ({
    month,
    documentos: Number(count)
  })).sort((a, b) => a.month.localeCompare(b.month)) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reportes y Análisis</h1>
        <p className="text-muted-foreground">
          Análisis detallado de datos y tendencias del estudio jurídico
        </p>
      </div>

      {/* Dashboard Stats Cards */}
      {dashboardStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Causas Activas</CardTitle>
              <Gavel className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.activeCases}</div>
              <p className="text-xs text-muted-foreground">
                En proceso actualmente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.pendingTasks}</div>
              <p className="text-xs text-muted-foreground">
                Por completar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tareas Vencidas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{dashboardStats.overdueTasks}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.activeClients}</div>
              <p className="text-xs text-muted-foreground">
                Total en cartera
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="casos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="casos">Análisis de Casos</TabsTrigger>
          <TabsTrigger value="tareas">Gestión de Tareas</TabsTrigger>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="casos" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Casos por Tipo
                </CardTitle>
                <CardDescription>
                  Distribución de casos activos según su tipo
                </CardDescription>
              </CardHeader>
              <CardContent>
                {caseTypeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={caseTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {caseTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No hay datos disponibles
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Casos por Tribunal
                </CardTitle>
                <CardDescription>
                  Distribución de casos según el tribunal asignado
                </CardDescription>
              </CardHeader>
              <CardContent>
                {courtData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={courtData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip 
                        labelFormatter={(label) => {
                          const item = courtData.find(d => d.name === label);
                          return item ? item.fullName : label;
                        }}
                      />
                      <Bar dataKey="value" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No hay datos disponibles
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tareas" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Tareas Urgentes
                </CardTitle>
                <CardDescription>
                  Tareas que requieren atención inmediata
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingTasks?.urgent && upcomingTasks.urgent.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {upcomingTasks.urgent.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium">{task.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Vence: {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="destructive">Urgente</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No hay tareas urgentes
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Tareas Vencidas
                </CardTitle>
                <CardDescription>
                  Tareas que han superado su fecha límite
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingTasks?.overdue && upcomingTasks.overdue.length > 0 ? (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {upcomingTasks.overdue.map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                        <div className="flex-1">
                          <div className="font-medium text-red-800">{task.name}</div>
                          <div className="text-sm text-red-600">
                            Venció: {new Date(task.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge variant="destructive">Vencida</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No hay tareas vencidas
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de Tareas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {upcomingTasks ? upcomingTasks.urgent?.length || 0 : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Urgentes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">
                    {upcomingTasks ? upcomingTasks.overdue?.length || 0 : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Vencidas</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {upcomingTasks ? upcomingTasks.total || 0 : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documentos Generados por Mes
              </CardTitle>
              <CardDescription>
                Tendencia de generación de documentos en el tiempo
              </CardDescription>
            </CardHeader>
            <CardContent>
              {documentsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={documentsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="documentos" 
                      stroke="#0088FE" 
                      strokeWidth={2}
                      dot={{ fill: '#0088FE' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No hay datos disponibles
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Este Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardStats?.documentsThisMonth || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Documentos generados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nuevos Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {dashboardStats?.newClientsThisMonth || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Este mes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Promedio Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {documentsData.length > 0 ? 
                    Math.round(documentsData.reduce((sum, item) => sum + item.documentos, 0) / documentsData.length) : 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Documentos por mes
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tendencias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Análisis de Tendencias
              </CardTitle>
              <CardDescription>
                Indicadores clave del desempeño del estudio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold">Carga de Trabajo</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Casos Activos</span>
                        <span className="font-medium">{dashboardStats?.activeCases || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Tareas Pendientes</span>
                        <span className="font-medium">{dashboardStats?.pendingTasks || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Ratio Tareas/Casos</span>
                        <span className="font-medium">
                          {dashboardStats?.activeCases ? 
                            ((dashboardStats.pendingTasks / dashboardStats.activeCases) || 0).toFixed(1) : 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Eficiencia</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Tareas Vencidas</span>
                        <span className={`font-medium ${dashboardStats?.overdueTasks && dashboardStats.overdueTasks > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {dashboardStats?.overdueTasks || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">% Cumplimiento</span>
                        <span className="font-medium text-green-600">
                          {dashboardStats?.pendingTasks ? 
                            (((dashboardStats.pendingTasks - (dashboardStats.overdueTasks || 0)) / dashboardStats.pendingTasks * 100) || 0).toFixed(1) : 100}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Docs/Cliente</span>
                        <span className="font-medium">
                          {dashboardStats?.activeClients ? 
                            ((dashboardStats.documentsThisMonth || 0) / dashboardStats.activeClients).toFixed(1) : 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Recomendaciones</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {dashboardStats?.overdueTasks && dashboardStats.overdueTasks > 5 && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Alta cantidad de tareas vencidas. Revisar asignación de recursos.</span>
                      </div>
                    )}
                    
                    {dashboardStats?.pendingTasks && dashboardStats.activeCases && 
                     (dashboardStats.pendingTasks / dashboardStats.activeCases) > 3 && (
                      <div className="flex items-center gap-2 text-orange-600">
                        <Clock className="h-4 w-4" />
                        <span>Ratio alto de tareas por caso. Considerar optimización de procesos.</span>
                      </div>
                    )}

                    {(!dashboardStats?.overdueTasks || dashboardStats.overdueTasks === 0) && (
                      <div className="flex items-center gap-2 text-green-600">
                        <TrendingUp className="h-4 w-4" />
                        <span>Excelente gestión de tareas. No hay retrasos.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}