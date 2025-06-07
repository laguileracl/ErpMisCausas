import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, Filter, Calendar, User, FileText, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  entityType: string | null;
  entityId: number | null;
  oldValues: any;
  newValues: any;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
}

export default function AuditoriaPage() {
  const [filters, setFilters] = useState({
    userId: "",
    action: "",
    entityType: "",
    startDate: "",
    endDate: "",
    search: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const itemsPerPage = 50;

  // Fetch audit logs with filters
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['/api/audit-logs', filters, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('limit', itemsPerPage.toString());
      params.append('offset', ((currentPage - 1) * itemsPerPage).toString());

      const response = await fetch(`/api/audit-logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return response.json();
    }
  });

  // Fetch users for filter dropdown
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  const auditLogs = auditData?.auditLogs || [];
  const totalCount = auditData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      userId: "",
      action: "",
      entityType: "",
      startDate: "",
      endDate: "",
      search: ""
    });
    setCurrentPage(1);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-500';
      case 'update': return 'bg-blue-500';
      case 'delete': return 'bg-red-500';
      case 'login': return 'bg-purple-500';
      case 'logout': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'create': 'Crear',
      'update': 'Actualizar',
      'delete': 'Eliminar',
      'login': 'Iniciar Sesión',
      'logout': 'Cerrar Sesión',
      'read': 'Consultar'
    };
    return labels[action] || action;
  };

  const getEntityTypeLabel = (entityType: string | null) => {
    if (!entityType) return '-';
    const labels: Record<string, string> = {
      'client': 'Cliente',
      'company': 'Empresa',
      'contact': 'Contacto',
      'legal-case': 'Causa Judicial',
      'document': 'Documento',
      'activity': 'Actividad',
      'task': 'Tarea',
      'user': 'Usuario'
    };
    return labels[entityType] || entityType;
  };

  const getUserName = (userId: number | null) => {
    if (!userId || !users) return 'Sistema';
    const user = users.find((u: User) => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : `Usuario #${userId}`;
  };

  const formatTimestamp = (timestamp: Date) => {
    return format(new Date(timestamp), "dd/MM/yyyy HH:mm:ss", { locale: es });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Auditoría del Sistema</h1>
        <p className="text-muted-foreground">Registro completo de actividades y cambios en el sistema</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-filter">Usuario</Label>
              <Select value={filters.userId} onValueChange={(value) => handleFilterChange('userId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los usuarios</SelectItem>
                  {users?.map((user: User) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.firstName} {user.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action-filter">Acción</Label>
              <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las acciones</SelectItem>
                  <SelectItem value="create">Crear</SelectItem>
                  <SelectItem value="update">Actualizar</SelectItem>
                  <SelectItem value="delete">Eliminar</SelectItem>
                  <SelectItem value="login">Iniciar Sesión</SelectItem>
                  <SelectItem value="logout">Cerrar Sesión</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entity-filter">Tipo de Entidad</Label>
              <Select value={filters.entityType} onValueChange={(value) => handleFilterChange('entityType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las entidades</SelectItem>
                  <SelectItem value="client">Cliente</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                  <SelectItem value="contact">Contacto</SelectItem>
                  <SelectItem value="legal-case">Causa Judicial</SelectItem>
                  <SelectItem value="document">Documento</SelectItem>
                  <SelectItem value="activity">Actividad</SelectItem>
                  <SelectItem value="task">Tarea</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start-date">Fecha Inicio</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">Fecha Fin</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Búsqueda General</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Buscar en registros..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {totalCount > 0 ? (
                <>Mostrando {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalCount)} de {totalCount} registros</>
              ) : (
                'No se encontraron registros'
              )}
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de registros */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoría</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Cargando registros...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron registros con los filtros aplicados
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log: AuditLog) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {formatTimestamp(log.timestamp)}
                      </TableCell>
                      <TableCell>{getUserName(log.userId)}</TableCell>
                      <TableCell>
                        <Badge className={`${getActionBadgeColor(log.action)} text-white`}>
                          {getActionLabel(log.action)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {getEntityTypeLabel(log.entityType)}
                        {log.entityId && (
                          <span className="text-muted-foreground ml-1">#{log.entityId}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.ipAddress || '-'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(log)}
                        >
                          <Eye className="h-4 w-4" />
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + Math.max(1, currentPage - 2);
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalles */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalles del Registro de Auditoría</DialogTitle>
            <DialogDescription>
              Información completa del registro seleccionado
            </DialogDescription>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ID del Registro</Label>
                  <p className="text-sm text-muted-foreground">#{selectedLog.id}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fecha y Hora</Label>
                  <p className="text-sm text-muted-foreground">{formatTimestamp(selectedLog.timestamp)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Usuario</Label>
                  <p className="text-sm text-muted-foreground">{getUserName(selectedLog.userId)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Acción</Label>
                  <Badge className={`${getActionBadgeColor(selectedLog.action)} text-white`}>
                    {getActionLabel(selectedLog.action)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Tipo de Entidad</Label>
                  <p className="text-sm text-muted-foreground">{getEntityTypeLabel(selectedLog.entityType)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ID de Entidad</Label>
                  <p className="text-sm text-muted-foreground">{selectedLog.entityId || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Dirección IP</Label>
                  <p className="text-sm text-muted-foreground">{selectedLog.ipAddress || '-'}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">User Agent</Label>
                  <p className="text-sm text-muted-foreground break-all">{selectedLog.userAgent || '-'}</p>
                </div>
              </div>

              {(selectedLog.oldValues || selectedLog.newValues) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLog.oldValues && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Valores Anteriores</Label>
                      <div className="bg-red-50 border border-red-200 rounded p-3">
                        <pre className="text-xs text-red-800 whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.oldValues, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {selectedLog.newValues && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Valores Nuevos</Label>
                      <div className="bg-green-50 border border-green-200 rounded p-3">
                        <pre className="text-xs text-green-800 whitespace-pre-wrap">
                          {JSON.stringify(selectedLog.newValues, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}