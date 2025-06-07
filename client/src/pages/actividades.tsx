import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, Calendar, Clock, Phone, Mail, Users, FileText, MessageSquare, Edit, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertActivitySchema, type Activity, type LegalCase, type User as UserType } from "@shared/schema";
import { z } from "zod";

const activityTypeMap = {
  phone_call: { label: "Llamada Telefónica", icon: Phone, color: "bg-blue-500" },
  email: { label: "Correo Electrónico", icon: Mail, color: "bg-green-500" },
  meeting: { label: "Reunión", icon: Users, color: "bg-purple-500" },
  whatsapp: { label: "WhatsApp", icon: MessageSquare, color: "bg-green-600" },
  document_filing: { label: "Ingreso de Escrito", icon: FileText, color: "bg-orange-500" },
  internal_note: { label: "Nota Interna", icon: Edit, color: "bg-gray-500" }
};

const formSchema = insertActivitySchema.extend({
  description: z.string().min(1, "La descripción es obligatoria"),
  activityType: z.string().min(1, "El tipo de actividad es obligatorio"),
  legalCaseId: z.number().min(1, "La causa judicial es obligatoria"),
});

export default function ActividadesPage() {
  const [isNewActivityOpen, setIsNewActivityOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [caseFilter, setCaseFilter] = useState<string>("all");

  // Queries
  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/activities"],
  });

  const { data: legalCases = [] } = useQuery({
    queryKey: ["/api/legal-cases"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Forms
  const newActivityForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      activityType: "",
      legalCaseId: 0,
      activityDate: new Date().toISOString().slice(0, 16),
      duration: 0,
      participants: "",
      notes: "",
    },
  });

  const editForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      activityType: "",
      legalCaseId: 0,
      activityDate: "",
      duration: 0,
      participants: "",
      notes: "",
    },
  });

  // Mutations
  const createActivity = useMutation({
    mutationFn: (data: any) => apiRequest("/api/activities", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setIsNewActivityOpen(false);
      newActivityForm.reset();
    },
  });

  const updateActivity = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/activities/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      setIsEditOpen(false);
      setSelectedActivity(null);
    },
  });

  const deleteActivity = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/activities/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
  });

  // Handlers
  const handleEdit = (activity: Activity) => {
    setSelectedActivity(activity);
    editForm.reset({
      description: activity.description,
      activityType: activity.activityType,
      legalCaseId: activity.legalCaseId,
      activityDate: new Date(activity.activityDate).toISOString().slice(0, 16),
      duration: activity.duration || 0,
      participants: activity.participants || "",
      notes: activity.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleViewDetails = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDetailsOpen(true);
  };

  const onSubmitNew = (data: any) => {
    const submitData = {
      ...data,
      legalCaseId: Number(data.legalCaseId),
      activityDate: new Date(data.activityDate).toISOString(),
      duration: data.duration ? Number(data.duration) : null,
    };
    createActivity.mutate(submitData);
  };

  const onSubmitEdit = (data: any) => {
    const submitData = {
      id: selectedActivity?.id,
      ...data,
      legalCaseId: Number(data.legalCaseId),
      activityDate: new Date(data.activityDate).toISOString(),
      duration: data.duration ? Number(data.duration) : null,
    };
    updateActivity.mutate(submitData);
  };

  // Filter activities
  const filteredActivities = Array.isArray(activities) ? activities.filter((activity: Activity) => {
    const matchesSearch = activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || activity.activityType === typeFilter;
    const matchesCase = caseFilter === "all" || activity.legalCaseId.toString() === caseFilter;
    
    return matchesSearch && matchesType && matchesCase;
  }) : [];

  const getLegalCaseName = (id: number) => {
    const legalCase = Array.isArray(legalCases) ? legalCases.find((lc: LegalCase) => lc.id === id) : null;
    return legalCase ? `${legalCase.rol} - ${legalCase.title}` : "Causa no encontrada";
  };

  const getUserName = (id: number) => {
    const user = Array.isArray(users) ? users.find((u: UserType) => u.id === id) : null;
    return user ? `${user.firstName} ${user.lastName}` : "Usuario no encontrado";
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Actividades</h1>
          <p className="text-muted-foreground">Registro y seguimiento de actividades por causa judicial</p>
        </div>
        <Dialog open={isNewActivityOpen} onOpenChange={setIsNewActivityOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Actividad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Actividad</DialogTitle>
              <DialogDescription>
                Registrar una nueva actividad relacionada con una causa judicial
              </DialogDescription>
            </DialogHeader>
            <Form {...newActivityForm}>
              <form onSubmit={newActivityForm.handleSubmit(onSubmitNew)} className="space-y-4">
                <FormField
                  control={newActivityForm.control}
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
                    control={newActivityForm.control}
                    name="activityType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Actividad *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(activityTypeMap).map(([key, { label }]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newActivityForm.control}
                    name="activityDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha y Hora *</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={newActivityForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descripción de la actividad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={newActivityForm.control}
                    name="duration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración (minutos)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newActivityForm.control}
                    name="participants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Participantes</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombres de participantes" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={newActivityForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas Adicionales</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notas sobre la actividad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsNewActivityOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createActivity.isPending}>
                    {createActivity.isPending ? "Creando..." : "Crear Actividad"}
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
                  placeholder="Buscar por descripción..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Tipo de actividad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(activityTypeMap).map(([key, { label }]) => (
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

      {/* Activities List */}
      {activitiesLoading ? (
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
          {filteredActivities.map((activity: Activity) => {
            const activityTypeInfo = activityTypeMap[activity.activityType as keyof typeof activityTypeMap];
            const IconComponent = activityTypeInfo?.icon || FileText;
            
            return (
              <Card key={activity.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${activityTypeInfo?.color || 'bg-gray-500'}`}>
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{activity.description}</CardTitle>
                        <CardDescription>
                          {getLegalCaseName(activity.legalCaseId)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(activity)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(activity)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteActivity.mutate(activity.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Badge className={`${activityTypeInfo?.color || 'bg-gray-500'} text-white`}>
                        {activityTypeInfo?.label || activity.activityType}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(activity.activityDate).toLocaleDateString('es-CL')}
                      </span>
                      <Clock className="h-4 w-4 text-muted-foreground ml-2" />
                      <span className="text-sm">
                        {new Date(activity.activityDate).toLocaleTimeString('es-CL', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {activity.duration && (
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{activity.duration} min</span>
                      </div>
                    )}
                  </div>
                  {activity.participants && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">Participantes: </span>
                      <span className="text-sm">{activity.participants}</span>
                    </div>
                  )}
                  {activity.notes && (
                    <div className="mt-2">
                      <span className="text-sm text-muted-foreground">Notas: </span>
                      <span className="text-sm">{activity.notes}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Actividad</DialogTitle>
            <DialogDescription>
              Modificar los datos de la actividad
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
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
                  name="activityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Actividad *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(activityTypeMap).map(([key, { label }]) => (
                            <SelectItem key={key} value={key}>
                              {label}
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
                  name="activityDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha y Hora *</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
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
                      <Textarea placeholder="Descripción de la actividad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración (minutos)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="participants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Participantes</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombres de participantes" {...field} />
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
                      <Textarea placeholder="Notas sobre la actividad" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateActivity.isPending}>
                  {updateActivity.isPending ? "Guardando..." : "Guardar Cambios"}
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
            <DialogTitle>Detalles de la Actividad</DialogTitle>
          </DialogHeader>
          
          {selectedActivity && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {(() => {
                  const activityTypeInfo = activityTypeMap[selectedActivity.activityType as keyof typeof activityTypeMap];
                  const IconComponent = activityTypeInfo?.icon || FileText;
                  return (
                    <div className={`p-3 rounded-lg ${activityTypeInfo?.color || 'bg-gray-500'}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-lg font-semibold">{selectedActivity.description}</h3>
                  <p className="text-muted-foreground">
                    {activityTypeMap[selectedActivity.activityType as keyof typeof activityTypeMap]?.label || selectedActivity.activityType}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Información General</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Causa:</span>
                      <span className="text-sm">{getLegalCaseName(selectedActivity.legalCaseId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha:</span>
                      <span className="text-sm">
                        {new Date(selectedActivity.activityDate).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hora:</span>
                      <span className="text-sm">
                        {new Date(selectedActivity.activityDate).toLocaleTimeString('es-CL', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {selectedActivity.duration && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duración:</span>
                        <span className="text-sm">{selectedActivity.duration} minutos</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Registro</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Registrado:</span>
                      <span className="text-sm">
                        {new Date(selectedActivity.createdAt).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    {selectedActivity.createdByUserId && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Por:</span>
                        <span className="text-sm">{getUserName(selectedActivity.createdByUserId)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedActivity.participants && (
                <div>
                  <h4 className="font-semibold mb-2">Participantes</h4>
                  <p className="text-sm text-muted-foreground">{selectedActivity.participants}</p>
                </div>
              )}

              {selectedActivity.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notas</h4>
                  <p className="text-sm text-muted-foreground">{selectedActivity.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}