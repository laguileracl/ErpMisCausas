import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, Calendar, Users, Building, FileText, Gavel, Edit, Trash2, Eye } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertLegalCaseSchema, type LegalCase, type CaseType, type StudioRole, type Court, type CaseRole, type CaseCourt, type ProcessStage, type Client, type Company, type Contact } from "@shared/schema";
import { z } from "zod";

const statusMap = {
  active: { label: "Activa", color: "bg-green-500" },
  suspended: { label: "Suspendida", color: "bg-yellow-500" },
  closed: { label: "Cerrada", color: "bg-red-500" },
  archived: { label: "Archivada", color: "bg-gray-500" }
};

const priorityMap = {
  low: { label: "Baja", color: "bg-blue-500" },
  medium: { label: "Media", color: "bg-yellow-500" },
  high: { label: "Alta", color: "bg-orange-500" },
  urgent: { label: "Urgente", color: "bg-red-500" }
};

const formSchema = insertLegalCaseSchema.extend({
  rol: z.string().min(1, "El ROL es obligatorio"),
  title: z.string().min(1, "El título es obligatorio"),
  caseTypeId: z.number().min(1, "El tipo de causa es obligatorio"),
  studioRoleId: z.number().min(1, "El rol del estudio es obligatorio"),
});

export default function CausasPage() {
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Queries
  const { data: cases = [], isLoading: casesLoading } = useQuery({
    queryKey: ["/api/legal-cases"],
  });

  const { data: caseTypes = [] } = useQuery({
    queryKey: ["/api/case-types"],
  });

  const { data: studioRoles = [] } = useQuery({
    queryKey: ["/api/studio-roles"],
  });

  const { data: courts = [] } = useQuery({
    queryKey: ["/api/courts"],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ["/api/contacts"],
  });

  // Case details queries
  const { data: caseCourts = [] } = useQuery({
    queryKey: ["/api/case-courts", selectedCase?.id],
    enabled: !!selectedCase?.id,
  });

  const { data: caseRoles = [] } = useQuery({
    queryKey: ["/api/case-roles", selectedCase?.id],
    enabled: !!selectedCase?.id,
  });

  const { data: processStages = [] } = useQuery({
    queryKey: ["/api/process-stages", selectedCase?.id],
    enabled: !!selectedCase?.id,
  });

  // Forms
  const newCaseForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rol: "",
      title: "",
      description: "",
      caseTypeId: 0,
      studioRoleId: 0,
      status: "active",
      priority: "medium",
      estimatedValue: "",
      startDate: new Date().toISOString().split('T')[0],
      expectedEndDate: "",
      assignedUserId: null,
      notes: "",
    },
  });

  const editForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rol: "",
      title: "",
      description: "",
      caseTypeId: 0,
      studioRoleId: 0,
      status: "active",
      priority: "medium",
      estimatedValue: "",
      startDate: "",
      expectedEndDate: "",
      assignedUserId: null,
      notes: "",
    },
  });

  // Mutations
  const createCase = useMutation({
    mutationFn: (data: any) => apiRequest("/api/legal-cases", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-cases"] });
      setIsNewCaseOpen(false);
      newCaseForm.reset();
    },
  });

  const updateCase = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/legal-cases/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-cases"] });
      setIsEditOpen(false);
      setSelectedCase(null);
    },
  });

  const deleteCase = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/legal-cases/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/legal-cases"] });
    },
  });

  // Handlers
  const handleEdit = (legalCase: LegalCase) => {
    setSelectedCase(legalCase);
    editForm.reset({
      rol: legalCase.rol,
      title: legalCase.title,
      description: legalCase.description || "",
      caseTypeId: legalCase.caseTypeId,
      studioRoleId: legalCase.studioRoleId,
      status: legalCase.status as any,
      priority: legalCase.priority as any,
      estimatedValue: legalCase.estimatedValue || "",
      startDate: legalCase.startDate ? new Date(legalCase.startDate).toISOString().split('T')[0] : "",
      expectedEndDate: legalCase.expectedEndDate ? new Date(legalCase.expectedEndDate).toISOString().split('T')[0] : "",
      assignedUserId: legalCase.assignedUserId,
      notes: legalCase.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleViewDetails = (legalCase: LegalCase) => {
    setSelectedCase(legalCase);
    setIsDetailsOpen(true);
  };

  const onSubmitNew = (data: any) => {
    const submitData = {
      ...data,
      caseTypeId: Number(data.caseTypeId),
      studioRoleId: Number(data.studioRoleId),
      estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : null,
      startDate: new Date(data.startDate).toISOString(),
      expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate).toISOString() : null,
    };
    createCase.mutate(submitData);
  };

  const onSubmitEdit = (data: any) => {
    const submitData = {
      id: selectedCase?.id,
      ...data,
      caseTypeId: Number(data.caseTypeId),
      studioRoleId: Number(data.studioRoleId),
      estimatedValue: data.estimatedValue ? parseFloat(data.estimatedValue) : null,
      startDate: new Date(data.startDate).toISOString(),
      expectedEndDate: data.expectedEndDate ? new Date(data.expectedEndDate).toISOString() : null,
    };
    updateCase.mutate(submitData);
  };

  // Filter cases
  const filteredCases = Array.isArray(cases) ? cases.filter((legalCase: LegalCase) => {
    const matchesSearch = 
      legalCase.rol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      legalCase.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || legalCase.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || legalCase.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  }) : [];

  const getCaseTypeName = (id: number) => {
    const caseType = Array.isArray(caseTypes) ? caseTypes.find((ct: CaseType) => ct.id === id) : null;
    return caseType?.name || "Sin especificar";
  };

  const getStudioRoleName = (id: number) => {
    const studioRole = Array.isArray(studioRoles) ? studioRoles.find((sr: StudioRole) => sr.id === id) : null;
    return studioRole?.name || "Sin especificar";
  };

  const getCourtName = (id: number) => {
    const court = Array.isArray(courts) ? courts.find((c: Court) => c.id === id) : null;
    return court?.name || "Sin especificar";
  };

  const getEntityName = (entityType: string, entityId: number) => {
    switch (entityType) {
      case 'client':
        const client = Array.isArray(clients) ? clients.find((c: Client) => c.id === entityId) : null;
        return client ? `${client.firstName} ${client.lastName}` : "Cliente no encontrado";
      case 'company':
        const company = Array.isArray(companies) ? companies.find((c: Company) => c.id === entityId) : null;
        return company?.name || "Empresa no encontrada";
      case 'contact':
        const contact = Array.isArray(contacts) ? contacts.find((c: Contact) => c.id === entityId) : null;
        return contact ? `${contact.firstName} ${contact.lastName}` : "Contacto no encontrado";
      default:
        return "Entidad no encontrada";
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Causas Judiciales</h1>
          <p className="text-muted-foreground">Gestión de causas legales y procesos judiciales</p>
        </div>
        <Dialog open={isNewCaseOpen} onOpenChange={setIsNewCaseOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Causa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Causa Judicial</DialogTitle>
              <DialogDescription>
                Crear una nueva causa judicial en el sistema
              </DialogDescription>
            </DialogHeader>
            <Form {...newCaseForm}>
              <form onSubmit={newCaseForm.handleSubmit(onSubmitNew)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={newCaseForm.control}
                    name="rol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ROL/RIT *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ej: C-1234-2024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newCaseForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input placeholder="Título de la causa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={newCaseForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descripción de la causa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={newCaseForm.control}
                    name="caseTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Causa *</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(caseTypes) && caseTypes.map((caseType: CaseType) => (
                              <SelectItem key={caseType.id} value={caseType.id.toString()}>
                                {caseType.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newCaseForm.control}
                    name="studioRoleId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rol del Estudio *</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Array.isArray(studioRoles) && studioRoles.map((studioRole: StudioRole) => (
                              <SelectItem key={studioRole.id} value={studioRole.id.toString()}>
                                {studioRole.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={newCaseForm.control}
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
                            <SelectItem value="active">Activa</SelectItem>
                            <SelectItem value="suspended">Suspendida</SelectItem>
                            <SelectItem value="closed">Cerrada</SelectItem>
                            <SelectItem value="archived">Archivada</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newCaseForm.control}
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
                    control={newCaseForm.control}
                    name="estimatedValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor Estimado (CLP)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newCaseForm.control}
                    name="expectedEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Estimada de Término</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={newCaseForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notas adicionales" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsNewCaseOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createCase.isPending}>
                    {createCase.isPending ? "Creando..." : "Crear Causa"}
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
                  placeholder="Buscar por ROL o título..."
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
                <SelectItem value="active">Activa</SelectItem>
                <SelectItem value="suspended">Suspendida</SelectItem>
                <SelectItem value="closed">Cerrada</SelectItem>
                <SelectItem value="archived">Archivada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cases Grid */}
      {casesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCases.map((legalCase: LegalCase) => (
            <Card key={legalCase.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{legalCase.title}</CardTitle>
                    <CardDescription>ROL: {legalCase.rol}</CardDescription>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(legalCase)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(legalCase)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteCase.mutate(legalCase.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Tipo:</span>
                    <span className="text-sm">{getCaseTypeName(legalCase.caseTypeId)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Rol Estudio:</span>
                    <span className="text-sm">{getStudioRoleName(legalCase.studioRoleId)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Estado:</span>
                    <Badge className={`${statusMap[legalCase.status as keyof typeof statusMap]?.color} text-white`}>
                      {statusMap[legalCase.status as keyof typeof statusMap]?.label}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Prioridad:</span>
                    <Badge className={`${priorityMap[legalCase.priority as keyof typeof priorityMap]?.color} text-white`}>
                      {priorityMap[legalCase.priority as keyof typeof priorityMap]?.label}
                    </Badge>
                  </div>
                  {legalCase.estimatedValue && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Valor:</span>
                      <span className="text-sm font-medium">
                        ${new Intl.NumberFormat('es-CL').format(Number(legalCase.estimatedValue))}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Inicio:</span>
                    <span className="text-sm">
                      {new Date(legalCase.startDate).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Causa Judicial</DialogTitle>
            <DialogDescription>
              Modificar los datos de la causa judicial
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="rol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ROL/RIT *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: C-1234-2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Título de la causa" {...field} />
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
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descripción de la causa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="caseTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Causa *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(caseTypes) && caseTypes.map((caseType: CaseType) => (
                            <SelectItem key={caseType.id} value={caseType.id.toString()}>
                              {caseType.name}
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
                  name="studioRoleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol del Estudio *</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.isArray(studioRoles) && studioRoles.map((studioRole: StudioRole) => (
                            <SelectItem key={studioRole.id} value={studioRole.id.toString()}>
                              {studioRole.name}
                            </SelectItem>
                          ))}
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
                          <SelectItem value="active">Activa</SelectItem>
                          <SelectItem value="suspended">Suspendida</SelectItem>
                          <SelectItem value="closed">Cerrada</SelectItem>
                          <SelectItem value="archived">Archivada</SelectItem>
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
                  name="estimatedValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Estimado (CLP)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="expectedEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha Estimada de Término</FormLabel>
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas adicionales" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateCase.isPending}>
                  {updateCase.isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCase?.title}</DialogTitle>
            <DialogDescription>ROL: {selectedCase?.rol}</DialogDescription>
          </DialogHeader>
          
          {selectedCase && (
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="tribunales">Tribunales</TabsTrigger>
                <TabsTrigger value="participantes">Participantes</TabsTrigger>
                <TabsTrigger value="etapas">Etapas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Información Básica</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tipo de Causa:</span>
                        <span>{getCaseTypeName(selectedCase.caseTypeId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rol del Estudio:</span>
                        <span>{getStudioRoleName(selectedCase.studioRoleId)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estado:</span>
                        <Badge className={`${statusMap[selectedCase.status as keyof typeof statusMap]?.color} text-white`}>
                          {statusMap[selectedCase.status as keyof typeof statusMap]?.label}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Prioridad:</span>
                        <Badge className={`${priorityMap[selectedCase.priority as keyof typeof priorityMap]?.color} text-white`}>
                          {priorityMap[selectedCase.priority as keyof typeof priorityMap]?.label}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Fechas y Valores</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fecha de Inicio:</span>
                        <span>{new Date(selectedCase.startDate).toLocaleDateString('es-CL')}</span>
                      </div>
                      {selectedCase.expectedEndDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fecha Estimada de Término:</span>
                          <span>{new Date(selectedCase.expectedEndDate).toLocaleDateString('es-CL')}</span>
                        </div>
                      )}
                      {selectedCase.actualEndDate && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fecha Real de Término:</span>
                          <span>{new Date(selectedCase.actualEndDate).toLocaleDateString('es-CL')}</span>
                        </div>
                      )}
                      {selectedCase.estimatedValue && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor Estimado:</span>
                          <span className="font-medium">
                            ${new Intl.NumberFormat('es-CL').format(Number(selectedCase.estimatedValue))}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {selectedCase.description && (
                  <div>
                    <h4 className="font-semibold mb-2">Descripción</h4>
                    <p className="text-muted-foreground">{selectedCase.description}</p>
                  </div>
                )}
                
                {selectedCase.notes && (
                  <div>
                    <h4 className="font-semibold mb-2">Notas</h4>
                    <p className="text-muted-foreground">{selectedCase.notes}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="tribunales" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Tribunales Asociados</h4>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Tribunal
                  </Button>
                </div>
                <div className="space-y-2">
                  {Array.isArray(caseCourts) && caseCourts.length > 0 ? (
                    caseCourts.map((caseCourt: CaseCourt) => (
                      <Card key={caseCourt.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-medium">{getCourtName(caseCourt.courtId)}</h5>
                              <p className="text-sm text-muted-foreground">
                                Agregado: {new Date(caseCourt.addedAt).toLocaleDateString('es-CL')}
                              </p>
                            </div>
                            {caseCourt.isPrimary && (
                              <Badge>Tribunal Principal</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No hay tribunales asociados a esta causa</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="participantes" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Participantes en la Causa</h4>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Participante
                  </Button>
                </div>
                <div className="space-y-2">
                  {Array.isArray(caseRoles) && caseRoles.length > 0 ? (
                    caseRoles.map((caseRole: CaseRole) => (
                      <Card key={caseRole.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-medium">
                                {getEntityName(caseRole.entityType, caseRole.entityId)}
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                Rol: {caseRole.role} • Tipo: {caseRole.entityType === 'client' ? 'Cliente' : caseRole.entityType === 'company' ? 'Empresa' : 'Contacto'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Desde: {new Date(caseRole.startDate).toLocaleDateString('es-CL')}
                              </p>
                            </div>
                            <Badge variant={caseRole.isActive ? "default" : "secondary"}>
                              {caseRole.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No hay participantes asociados a esta causa</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="etapas" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Etapas del Proceso</h4>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Etapa
                  </Button>
                </div>
                <div className="space-y-2">
                  {Array.isArray(processStages) && processStages.length > 0 ? (
                    processStages.map((stage: ProcessStage) => (
                      <Card key={stage.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="font-medium">{stage.name}</h5>
                              {stage.description && (
                                <p className="text-sm text-muted-foreground">{stage.description}</p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                Creada: {new Date(stage.createdAt).toLocaleDateString('es-CL')}
                              </p>
                            </div>
                            <Badge variant={stage.isCompleted ? "default" : "secondary"}>
                              {stage.isCompleted ? "Completada" : "Pendiente"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No hay etapas definidas para esta causa</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}