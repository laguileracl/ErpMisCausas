import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, Calendar, Clock, User, CheckCircle, Circle, AlertCircle, Edit, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertTaskSchema, type Task, type LegalCase, type User as UserType } from "@shared/schema";
import { z } from "zod";

const taskStatusMap = {
  pending: { label: "Pendiente", icon: Circle, color: "bg-yellow-500" },
  in_progress: { label: "En Curso", icon: Clock, color: "bg-blue-500" },
  completed: { label: "Completada", icon: CheckCircle, color: "bg-green-500" },
  cancelled: { label: "Cancelada", icon: AlertCircle, color: "bg-red-500" }
};

const taskPriorityMap = {
  low: { label: "Baja", color: "bg-blue-500" },
  medium: { label: "Media", color: "bg-yellow-500" },
  high: { label: "Alta", color: "bg-orange-500" },
  urgent: { label: "Urgente", color: "bg-red-500" }
};

const formSchema = insertTaskSchema.extend({
  title: z.string().min(1, "El título es obligatorio"),
  description: z.string().min(1, "La descripción es obligatoria"),
  dueDate: z.string().min(1, "La fecha de vencimiento es obligatoria"),
  legalCaseId: z.number().min(1, "La causa judicial es obligatoria"),
});

export default function TareasPage() {
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [caseFilter, setCaseFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("list");

  // Queries
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["/api/tasks"],
  });

  const { data: legalCases = [] } = useQuery({
    queryKey: ["/api/legal-cases"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Forms
  const newTaskForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      legalCaseId: 0,
      assignedUserId: null,
      dueDate: "",
      status: "pending",
      priority: "medium",
      estimatedHours: 0,
      tags: "",
      notes: "",
    },
  });

  const editForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      legalCaseId: 0,
      assignedUserId: null,
      dueDate: "",
      status: "pending",
      priority: "medium",
      estimatedHours: 0,
      tags: "",
      notes: "",
    },
  });

  // Mutations
  const createTask = useMutation({
    mutationFn: (data: any) => apiRequest("/api/tasks", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setIsNewTaskOpen(false);
      newTaskForm.reset();
    },
  });

  const updateTask = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setIsEditOpen(false);
      setSelectedTask(null);
    },
  });

  const deleteTask = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/tasks/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const toggleTaskStatus = useMutation({
    mutationFn: (task: Task) => {
      const newStatus = task.status === "completed" ? "pending" : "completed";
      return apiRequest(`/api/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  // Handlers
  const handleEdit = (task: Task) => {
    setSelectedTask(task);
    editForm.reset({
      title: task.title,
      description: task.description,
      legalCaseId: task.legalCaseId,
      assignedUserId: task.assignedUserId,
      dueDate: new Date(task.dueDate).toISOString().split('T')[0],
      status: task.status as any,
      priority: task.priority as any,
      estimatedHours: task.estimatedHours || 0,
      tags: task.tags || "",
      notes: task.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleViewDetails = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsOpen(true);
  };

  const onSubmitNew = (data: any) => {
    const submitData = {
      ...data,
      legalCaseId: Number(data.legalCaseId),
      assignedUserId: data.assignedUserId ? Number(data.assignedUserId) : null,
      dueDate: new Date(data.dueDate).toISOString(),
      estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : null,
    };
    createTask.mutate(submitData);
  };

  const onSubmitEdit = (data: any) => {
    const submitData = {
      id: selectedTask?.id,
      ...data,
      legalCaseId: Number(data.legalCaseId),
      assignedUserId: data.assignedUserId ? Number(data.assignedUserId) : null,
      dueDate: new Date(data.dueDate).toISOString(),
      estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : null,
    };
    updateTask.mutate(submitData);
  };

  // Filter tasks
  const filteredTasks = Array.isArray(tasks) ? tasks.filter((task: Task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesCase = caseFilter === "all" || task.legalCaseId.toString() === caseFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCase;
  }) : [];

  // Calendar functions
  const getTasksForDate = (date: Date) => {
    return filteredTasks.filter((task: Task) => {
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === date.toDateString();
    });
  };

  const generateCalendarDays = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfCalendar = new Date(startOfMonth);
    startOfCalendar.setDate(startOfCalendar.getDate() - startOfCalendar.getDay());
    
    const days = [];
    const current = new Date(startOfCalendar);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getLegalCaseName = (id: number) => {
    const legalCase = Array.isArray(legalCases) ? legalCases.find((lc: LegalCase) => lc.id === id) : null;
    return legalCase ? `${legalCase.rol} - ${legalCase.title}` : "Causa no encontrada";
  };

  const getUserName = (id: number | null) => {
    if (!id) return "Sin asignar";
    const user = Array.isArray(users) ? users.find((u: UserType) => u.id === id) : null;
    return user ? `${user.firstName} ${user.lastName}` : "Usuario no encontrado";
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== "completed";
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tareas y Alarmas</h1>
          <p className="text-muted-foreground">Gestión de tareas y recordatorios por causa judicial</p>
        </div>
        <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Tarea
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Tarea</DialogTitle>
              <DialogDescription>
                Crear una nueva tarea o recordatorio para una causa judicial
              </DialogDescription>
            </DialogHeader>
            <Form {...newTaskForm}>
              <form onSubmit={newTaskForm.handleSubmit(onSubmitNew)} className="space-y-4">
                <FormField
                  control={newTaskForm.control}
                  name="legalCaseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Causa Judicial *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar causa" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(legalCases) && legalCases.map((legalCase: LegalCase) => (
                            <SelectItem key={legalCase.id} value={legalCase.id.toString()}>
                              {legalCase.rol} - {legalCase.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={newTaskForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input placeholder="Título de la tarea" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newTaskForm.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha de Vencimiento *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={newTaskForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descripción detallada de la tarea" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={newTaskForm.control}
                    name="assignedUserId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Usuario Responsable</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? Number(value) : null)} value={field.value?.toString() || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar usuario" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Sin asignar</SelectItem>
                            {Array.isArray(users) && users.map((user: User) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.firstName} {user.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newTaskForm.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prioridad</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Baja</SelectItem>
                            <SelectItem value="medium">Media</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="urgent">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={newTaskForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="in_progress">En Curso</SelectItem>
                            <SelectItem value="completed">Completada</SelectItem>
                            <SelectItem value="cancelled">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newTaskForm.control}
                    name="estimatedHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horas Estimadas</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={newTaskForm.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etiquetas</FormLabel>
                      <FormControl>
                        <Input placeholder="urgente, reunion, documentos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={newTaskForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Adicionales</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notas sobre la tarea" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsNewTaskOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createTask.isPending}>
                    {createTask.isPending ? "Creando..." : "Crear Tarea"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título o descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {Object.entries(taskStatusMap).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                {Object.entries(taskPriorityMap).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={caseFilter} onValueChange={setCaseFilter}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Causa judicial" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las causas</SelectItem>
                {Array.isArray(legalCases) && legalCases.map((legalCase: LegalCase) => (
                  <SelectItem key={legalCase.id} value={legalCase.id.toString()}>
                    {legalCase.rol} - {legalCase.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Lista de Tareas</TabsTrigger>
          <TabsTrigger value="calendar">Calendario</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {tasksLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task: Task) => {
                const statusInfo = taskStatusMap[task.status as keyof typeof taskStatusMap];
                const priorityInfo = taskPriorityMap[task.priority as keyof typeof taskPriorityMap];
                const StatusIcon = statusInfo?.icon || Circle;
                const overdue = isOverdue(task.dueDate, task.status);
                
                return (
                  <Card key={task.id} className={`hover:shadow-lg transition-shadow ${overdue ? 'border-red-300 bg-red-50' : ''}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-start space-x-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleTaskStatus.mutate(task)}
                            className={`p-1 ${statusInfo?.color}`}
                          >
                            <StatusIcon className="h-5 w-5 text-white" />
                          </Button>
                          <div className="flex-1">
                            <CardTitle className={`text-lg ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                              {overdue && <span className="ml-2 text-red-500 text-sm font-normal">(Vencida)</span>}
                            </CardTitle>
                            <CardDescription>
                              {getLegalCaseName(task.legalCaseId)}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(task)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(task)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTask.mutate(task.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(task.dueDate).toLocaleDateString('es-CL')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{getUserName(task.assignedUserId)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${statusInfo?.color} text-white`}>
                            {statusInfo?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={`${priorityInfo?.color} text-white`}>
                            {priorityInfo?.label}
                          </Badge>
                        </div>
                      </div>
                      {task.estimatedHours && (
                        <div className="mt-2">
                          <span className="text-sm text-muted-foreground">Estimado: </span>
                          <span className="text-sm">{task.estimatedHours}h</span>
                        </div>
                      )}
                      {task.tags && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {task.tags.split(',').map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendario de Tareas</CardTitle>
              <CardDescription>
                Vista mensual de todas las tareas programadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 mb-4">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                  <div key={day} className="text-center font-semibold p-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {generateCalendarDays().map((date, index) => {
                  const tasksForDate = getTasksForDate(date);
                  const isCurrentMonth = date.getMonth() === new Date().getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();
                  
                  return (
                    <div
                      key={index}
                      className={`p-2 min-h-[80px] border rounded ${
                        !isCurrentMonth 
                          ? 'bg-gray-50 text-gray-400' 
                          : isToday 
                            ? 'bg-blue-50 border-blue-200' 
                            : 'bg-white'
                      }`}
                    >
                      <div className="font-semibold text-sm mb-1">
                        {date.getDate()}
                      </div>
                      <div className="space-y-1">
                        {tasksForDate.slice(0, 2).map((task: Task) => {
                          const statusInfo = taskStatusMap[task.status as keyof typeof taskStatusMap];
                          const overdue = isOverdue(task.dueDate, task.status);
                          
                          return (
                            <div
                              key={task.id}
                              className={`text-xs p-1 rounded cursor-pointer ${
                                overdue 
                                  ? 'bg-red-100 text-red-800 border border-red-200' 
                                  : statusInfo?.color.replace('bg-', 'bg-opacity-20 bg-') + ' border'
                              }`}
                              onClick={() => handleViewDetails(task)}
                              title={task.title}
                            >
                              {task.title.length > 15 ? `${task.title.substring(0, 15)}...` : task.title}
                            </div>
                          );
                        })}
                        {tasksForDate.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{tasksForDate.length - 2} más
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Tarea</DialogTitle>
            <DialogDescription>
              Modificar los datos de la tarea
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
              {/* Same form structure as new task form */}
              <FormField
                control={editForm.control}
                name="legalCaseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Causa Judicial *</FormLabel>
                    <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar causa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Array.isArray(legalCases) && legalCases.map((legalCase: LegalCase) => (
                          <SelectItem key={legalCase.id} value={legalCase.id.toString()}>
                            {legalCase.rol} - {legalCase.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Título de la tarea" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Vencimiento *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descripción detallada de la tarea" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="assignedUserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuario Responsable</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? Number(value) : null)} value={field.value?.toString() || ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar usuario" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Sin asignar</SelectItem>
                          {Array.isArray(users) && users.map((user: User) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.firstName} {user.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridad</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Baja</SelectItem>
                          <SelectItem value="medium">Media</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="urgent">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="in_progress">En Curso</SelectItem>
                          <SelectItem value="completed">Completada</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="estimatedHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horas Estimadas</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas Adicionales</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas sobre la tarea" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateTask.isPending}>
                  {updateTask.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Tarea</DialogTitle>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {(() => {
                  const statusInfo = taskStatusMap[selectedTask.status as keyof typeof taskStatusMap];
                  const StatusIcon = statusInfo?.icon || Circle;
                  return (
                    <div className={`p-3 rounded-lg ${statusInfo?.color}`}>
                      <StatusIcon className="h-6 w-6 text-white" />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-lg font-semibold">{selectedTask.title}</h3>
                  <p className="text-muted-foreground">
                    {taskStatusMap[selectedTask.status as keyof typeof taskStatusMap]?.label}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Información General</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Causa:</span>
                      <span className="text-sm">{getLegalCaseName(selectedTask.legalCaseId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vencimiento:</span>
                      <span className="text-sm">
                        {new Date(selectedTask.dueDate).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Responsable:</span>
                      <span className="text-sm">{getUserName(selectedTask.assignedUserId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prioridad:</span>
                      <Badge className={`${taskPriorityMap[selectedTask.priority as keyof typeof taskPriorityMap]?.color} text-white`}>
                        {taskPriorityMap[selectedTask.priority as keyof typeof taskPriorityMap]?.label}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Detalles</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creada:</span>
                      <span className="text-sm">
                        {new Date(selectedTask.createdAt).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    {selectedTask.estimatedHours && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estimado:</span>
                        <span className="text-sm">{selectedTask.estimatedHours} horas</span>
                      </div>
                    )}
                    {isOverdue(selectedTask.dueDate, selectedTask.status) && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estado:</span>
                        <Badge className="bg-red-500 text-white">Vencida</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Descripción</h4>
                <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
              </div>

              {selectedTask.tags && (
                <div>
                  <h4 className="font-semibold mb-2">Etiquetas</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedTask.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notas</h4>
                  <p className="text-sm text-muted-foreground">{selectedTask.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}