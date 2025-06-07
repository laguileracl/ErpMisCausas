import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Building, FileText, Clock, AlertTriangle, Gavel, TrendingUp, Plus, Upload, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { useState } from "react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  // Fetch dashboard statistics
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/reports/dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/reports/dashboard-stats');
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      return response.json();
    }
  });

  const { data: casesByType } = useQuery({
    queryKey: ['/api/reports/cases-by-type'],
    queryFn: async () => {
      const response = await fetch('/api/reports/cases-by-type');
      if (!response.ok) throw new Error('Failed to fetch cases by type');
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

  // Transform data for charts
  const caseTypeData = casesByType ? Object.entries(casesByType).map(([name, value], index) => ({
    name,
    value: Number(value),
    fill: COLORS[index % COLORS.length]
  })) : [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <Sidebar />
      
      <div className="ml-16 lg:ml-64 transition-all duration-300">
        <TopBar />
        
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Panel de Control</h1>
            <p className="text-gray-600">Resumen general del estudio jurídico MisCausas.cl</p>
          </div>

          {/* Dashboard Stats Cards */}
          {dashboardStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Causas Activas</CardTitle>
                  <Gavel className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.activeCases}</div>
                  <p className="text-xs text-muted-foreground">En proceso actualmente</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tareas Pendientes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.pendingTasks}</div>
                  <p className="text-xs text-muted-foreground">Por completar</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tareas Vencidas</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{dashboardStats.overdueTasks}</div>
                  <p className="text-xs text-muted-foreground">Requieren atención</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.activeClients}</div>
                  <p className="text-xs text-muted-foreground">Total en cartera</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cases by type chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    Distribución de Casos por Tipo
                  </CardTitle>
                  <CardDescription>Casos activos según su categoría</CardDescription>
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

              {/* Quick actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Acciones Rápidas</CardTitle>
                  <CardDescription>Accesos directos a funciones importantes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Link href="/causas">
                      <Button variant="outline" className="w-full h-20 flex-col">
                        <Plus className="h-6 w-6 mb-2" />
                        Nueva Causa
                      </Button>
                    </Link>
                    <Link href="/clientes">
                      <Button variant="outline" className="w-full h-20 flex-col">
                        <Users className="h-6 w-6 mb-2" />
                        Nuevo Cliente
                      </Button>
                    </Link>
                    <Link href="/importacion">
                      <Button variant="outline" className="w-full h-20 flex-col">
                        <Upload className="h-6 w-6 mb-2" />
                        Importar CSV
                      </Button>
                    </Link>
                    <Link href="/reportes">
                      <Button variant="outline" className="w-full h-20 flex-col">
                        <BarChart3 className="h-6 w-6 mb-2" />
                        Ver Reportes
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar content */}
            <div className="space-y-6">
              {/* Upcoming tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Tareas Próximas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingTasks?.urgent && upcomingTasks.urgent.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingTasks.urgent.slice(0, 5).map((task: any) => (
                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{task.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">Urgente</Badge>
                        </div>
                      ))}
                      <Link href="/tareas">
                        <Button variant="outline" size="sm" className="w-full">
                          Ver todas las tareas
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-4">
                      No hay tareas urgentes
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* System status */}
              <Card>
                <CardHeader>
                  <CardTitle>Estado del Sistema</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Base de Datos</span>
                    <Badge variant="default" className="bg-green-500">Activo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Servidor</span>
                    <Badge variant="default" className="bg-green-500">Activo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auditoría</span>
                    <Badge variant="default" className="bg-green-500">Activo</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Respaldos</span>
                    <Badge variant="default" className="bg-blue-500">Automático</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Recent activity summary */}
              {dashboardStats && (
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen del Mes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Documentos generados</span>
                      <span className="font-semibold">{dashboardStats.documentsThisMonth}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Nuevos clientes</span>
                      <span className="font-semibold">{dashboardStats.newClientsThisMonth}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Eficiencia tareas</span>
                      <span className="font-semibold text-green-600">
                        {dashboardStats.pendingTasks ? 
                          (((dashboardStats.pendingTasks - (dashboardStats.overdueTasks || 0)) / dashboardStats.pendingTasks * 100) || 0).toFixed(0) : 100}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
