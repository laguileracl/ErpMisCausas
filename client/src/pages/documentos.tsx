import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, FileText, Download, Eye, Edit, Trash2, Calendar, User, Template, Settings } from "lucide-react";
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
import { insertDocumentSchema, type Document, type LegalCase, type User as UserType } from "@shared/schema";
import { z } from "zod";

const documentStatusMap = {
  draft: { label: "Borrador", color: "bg-yellow-500" },
  review: { label: "En Revisión", color: "bg-blue-500" },
  approved: { label: "Aprobado", color: "bg-green-500" },
  rejected: { label: "Rechazado", color: "bg-red-500" },
  archived: { label: "Archivado", color: "bg-gray-500" }
};

const documentTypeMap = {
  contract: { label: "Contrato", icon: FileText },
  letter: { label: "Carta", icon: FileText },
  brief: { label: "Escrito", icon: FileText },
  motion: { label: "Solicitud", icon: FileText },
  report: { label: "Informe", icon: FileText },
  evidence: { label: "Prueba", icon: FileText },
  other: { label: "Otro", icon: FileText }
};

const formSchema = insertDocumentSchema.extend({
  title: z.string().min(1, "El título es obligatorio"),
  fileType: z.string().min(1, "El tipo de archivo es obligatorio"),
});

const generatedDocumentFormSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  templateName: z.string().min(1, "La plantilla es obligatoria"),
  legalCaseId: z.number().min(1, "La causa judicial es obligatoria"),
  parameters: z.string().optional(),
});

export default function DocumentosPage() {
  const [isNewDocumentOpen, setIsNewDocumentOpen] = useState(false);
  const [isGenerateDocumentOpen, setIsGenerateDocumentOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [caseFilter, setCaseFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("documents");

  // Queries
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/documents"],
  });

  const { data: generatedDocuments = [], isLoading: generatedLoading } = useQuery({
    queryKey: ["/api/generated-documents"],
  });

  const { data: legalCases = [] } = useQuery({
    queryKey: ["/api/legal-cases"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
  });

  // Forms
  const newDocumentForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      fileType: "",
      legalCaseId: null,
      status: "draft",
      content: "",
      filePath: "",
      fileSize: 0,
      version: "1.0",
      tags: "",
      notes: "",
    },
  });

  const generateDocumentForm = useForm({
    resolver: zodResolver(generatedDocumentFormSchema),
    defaultValues: {
      title: "",
      templateName: "",
      legalCaseId: 0,
      parameters: "",
    },
  });

  const editForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      fileType: "",
      legalCaseId: null,
      status: "draft",
      content: "",
      filePath: "",
      fileSize: 0,
      version: "1.0",
      tags: "",
      notes: "",
    },
  });

  // Mutations
  const createDocument = useMutation({
    mutationFn: (data: any) => apiRequest("/api/documents", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsNewDocumentOpen(false);
      newDocumentForm.reset();
    },
  });

  const generateDocument = useMutation({
    mutationFn: (data: any) => apiRequest("/api/generated-documents", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/generated-documents"] });
      setIsGenerateDocumentOpen(false);
      generateDocumentForm.reset();
    },
  });

  const updateDocument = useMutation({
    mutationFn: ({ id, ...data }: any) => apiRequest(`/api/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setIsEditOpen(false);
      setSelectedDocument(null);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/documents/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
  });

  const deleteGeneratedDocument = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/generated-documents/${id}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/generated-documents"] });
    },
  });

  // Handlers
  const handleEdit = (document: Document) => {
    setSelectedDocument(document);
    editForm.reset({
      title: document.title,
      fileType: document.fileType,
      legalCaseId: document.legalCaseId,
      status: document.status as any,
      content: document.content || "",
      filePath: document.filePath || "",
      fileSize: document.fileSize || 0,
      version: document.version || "1.0",
      tags: document.tags || "",
      notes: document.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleViewDetails = (document: Document) => {
    setSelectedDocument(document);
    setIsDetailsOpen(true);
  };

  const onSubmitNew = (data: any) => {
    const submitData = {
      ...data,
      legalCaseId: data.legalCaseId ? Number(data.legalCaseId) : null,
      fileSize: data.fileSize ? Number(data.fileSize) : null,
    };
    createDocument.mutate(submitData);
  };

  const onSubmitGenerate = (data: any) => {
    const submitData = {
      ...data,
      legalCaseId: Number(data.legalCaseId),
      parameters: data.parameters ? JSON.parse(data.parameters) : {},
      fileType: "pdf",
      status: "generated",
    };
    generateDocument.mutate(submitData);
  };

  const onSubmitEdit = (data: any) => {
    const submitData = {
      id: selectedDocument?.id,
      ...data,
      legalCaseId: data.legalCaseId ? Number(data.legalCaseId) : null,
      fileSize: data.fileSize ? Number(data.fileSize) : null,
    };
    updateDocument.mutate(submitData);
  };

  // Filter documents
  const filteredDocuments = Array.isArray(documents) ? documents.filter((document: Document) => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || document.status === statusFilter;
    const matchesType = typeFilter === "all" || document.fileType === typeFilter;
    const matchesCase = caseFilter === "all" || (document.legalCaseId && document.legalCaseId.toString() === caseFilter);
    
    return matchesSearch && matchesStatus && matchesType && matchesCase;
  }) : [];

  const filteredGeneratedDocuments = Array.isArray(generatedDocuments) ? generatedDocuments.filter((document: any) => {
    const matchesSearch = document.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCase = caseFilter === "all" || (document.legalCaseId && document.legalCaseId.toString() === caseFilter);
    
    return matchesSearch && matchesCase;
  }) : [];

  const getLegalCaseName = (id: number | null) => {
    if (!id) return "Sin asignar";
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
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground">Gestión de documentos y generación automática</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isGenerateDocumentOpen} onOpenChange={setIsGenerateDocumentOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Template className="mr-2 h-4 w-4" />
                Generar Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Generar Documento desde Plantilla</DialogTitle>
                <DialogDescription>
                  Crear un documento automáticamente usando una plantilla predefinida
                </DialogDescription>
              </DialogHeader>
              <Form {...generateDocumentForm}>
                <form onSubmit={generateDocumentForm.handleSubmit(onSubmitGenerate)} className="space-y-4">
                  <FormField
                    control={generateDocumentForm.control}
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
                      control={generateDocumentForm.control}
                      name="templateName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Plantilla *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar plantilla" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="demanda_civil">Demanda Civil</SelectItem>
                              <SelectItem value="contestacion_demanda">Contestación de Demanda</SelectItem>
                              <SelectItem value="escrito_alegatos">Escrito de Alegatos</SelectItem>
                              <SelectItem value="carta_requerimiento">Carta de Requerimiento</SelectItem>
                              <SelectItem value="contrato_prestacion">Contrato de Prestación de Servicios</SelectItem>
                              <SelectItem value="poder_judicial">Poder Judicial</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={generateDocumentForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título del Documento *</FormLabel>
                          <FormControl>
                            <Input placeholder="Título del documento generado" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={generateDocumentForm.control}
                    name="parameters"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parámetros (JSON)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder='{"demandante": "Juan Pérez", "demandado": "María García", "monto": "5000000"}'
                            {...field}
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsGenerateDocumentOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={generateDocument.isPending}>
                      {generateDocument.isPending ? "Generando..." : "Generar Documento"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isNewDocumentOpen} onOpenChange={setIsNewDocumentOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nuevo Documento</DialogTitle>
                <DialogDescription>
                  Registrar un nuevo documento en el sistema
                </DialogDescription>
              </DialogHeader>
              <Form {...newDocumentForm}>
                <form onSubmit={newDocumentForm.handleSubmit(onSubmitNew)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newDocumentForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título *</FormLabel>
                          <FormControl>
                            <Input placeholder="Título del documento" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={newDocumentForm.control}
                      name="fileType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Archivo *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pdf">PDF</SelectItem>
                              <SelectItem value="docx">Word (DOCX)</SelectItem>
                              <SelectItem value="doc">Word (DOC)</SelectItem>
                              <SelectItem value="txt">Texto (TXT)</SelectItem>
                              <SelectItem value="rtf">RTF</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={newDocumentForm.control}
                    name="legalCaseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Causa Judicial</FormLabel>
                        <Select onValueChange={(value) => field.onChange(value ? Number(value) : null)} value={field.value?.toString() || ""}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar causa (opcional)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Sin asignar</SelectItem>
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
                      control={newDocumentForm.control}
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
                              <SelectItem value="draft">Borrador</SelectItem>
                              <SelectItem value="review">En Revisión</SelectItem>
                              <SelectItem value="approved">Aprobado</SelectItem>
                              <SelectItem value="rejected">Rechazado</SelectItem>
                              <SelectItem value="archived">Archivado</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={newDocumentForm.control}
                      name="version"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Versión</FormLabel>
                          <FormControl>
                            <Input placeholder="1.0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={newDocumentForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contenido</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Contenido del documento" {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newDocumentForm.control}
                      name="filePath"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ruta del Archivo</FormLabel>
                          <FormControl>
                            <Input placeholder="/documents/archivo.pdf" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={newDocumentForm.control}
                      name="fileSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tamaño (bytes)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={newDocumentForm.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Etiquetas</FormLabel>
                        <FormControl>
                          <Input placeholder="contrato, civil, importante" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={newDocumentForm.control}
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
                    <Button type="button" variant="outline" onClick={() => setIsNewDocumentOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createDocument.isPending}>
                      {createDocument.isPending ? "Creando..." : "Crear Documento"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título..."
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
                {Object.entries(documentStatusMap).map(([key, { label }]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="docx">Word (DOCX)</SelectItem>
                <SelectItem value="doc">Word (DOC)</SelectItem>
                <SelectItem value="txt">Texto (TXT)</SelectItem>
                <SelectItem value="rtf">RTF</SelectItem>
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

      {/* Documents Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents">Documentos Regulares</TabsTrigger>
          <TabsTrigger value="generated">Documentos Generados</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          {documentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocuments.map((document: Document) => (
                <Card key={document.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-blue-500">
                          <FileText className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{document.title}</CardTitle>
                          <CardDescription>
                            {getLegalCaseName(document.legalCaseId)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(document)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(document)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteDocument.mutate(document.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Estado:</span>
                        <Badge className={`${documentStatusMap[document.status as keyof typeof documentStatusMap]?.color} text-white`}>
                          {documentStatusMap[document.status as keyof typeof documentStatusMap]?.label}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Tipo:</span>
                        <span className="text-sm font-medium">{document.fileType.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Versión:</span>
                        <span className="text-sm">{document.version}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Creado:</span>
                        <span className="text-sm">
                          {new Date(document.createdAt).toLocaleDateString('es-CL')}
                        </span>
                      </div>
                      {document.fileSize && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Tamaño:</span>
                          <span className="text-sm">
                            {(document.fileSize / 1024).toFixed(1)} KB
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="generated" className="space-y-4">
          {generatedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGeneratedDocuments.map((document: any) => (
                <Card key={document.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-green-500">
                          <Template className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{document.title}</CardTitle>
                          <CardDescription>
                            {getLegalCaseName(document.legalCaseId)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteGeneratedDocument.mutate(document.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Plantilla:</span>
                        <span className="text-sm font-medium">{document.templateName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Estado:</span>
                        <Badge className="bg-green-500 text-white">
                          Generado
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Generado:</span>
                        <span className="text-sm">
                          {document.generatedAt ? new Date(document.generatedAt).toLocaleDateString('es-CL') : 'N/A'}
                        </span>
                      </div>
                      {document.generatedByUserId && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Por:</span>
                          <span className="text-sm">{getUserName(document.generatedByUserId)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Documento</DialogTitle>
            <DialogDescription>
              Modificar los datos del documento
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
              {/* Same form structure as new document form */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Título del documento" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="fileType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Archivo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="docx">Word (DOCX)</SelectItem>
                          <SelectItem value="doc">Word (DOC)</SelectItem>
                          <SelectItem value="txt">Texto (TXT)</SelectItem>
                          <SelectItem value="rtf">RTF</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="legalCaseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Causa Judicial</FormLabel>
                    <Select onValueChange={(value) => field.onChange(value ? Number(value) : null)} value={field.value?.toString() || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar causa (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Sin asignar</SelectItem>
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
                          <SelectItem value="draft">Borrador</SelectItem>
                          <SelectItem value="review">En Revisión</SelectItem>
                          <SelectItem value="approved">Aprobado</SelectItem>
                          <SelectItem value="rejected">Rechazado</SelectItem>
                          <SelectItem value="archived">Archivado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Versión</FormLabel>
                      <FormControl>
                        <Input placeholder="1.0" {...field} />
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
                <Button type="submit" disabled={updateDocument.isPending}>
                  {updateDocument.isPending ? "Guardando..." : "Guardar Cambios"}
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
            <DialogTitle>Detalles del Documento</DialogTitle>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-lg bg-blue-500">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedDocument.title}</h3>
                  <p className="text-muted-foreground">{selectedDocument.fileType.toUpperCase()}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Información General</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Causa:</span>
                      <span className="text-sm">{getLegalCaseName(selectedDocument.legalCaseId)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estado:</span>
                      <Badge className={`${documentStatusMap[selectedDocument.status as keyof typeof documentStatusMap]?.color} text-white`}>
                        {documentStatusMap[selectedDocument.status as keyof typeof documentStatusMap]?.label}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Versión:</span>
                      <span className="text-sm">{selectedDocument.version}</span>
                    </div>
                    {selectedDocument.fileSize && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tamaño:</span>
                        <span className="text-sm">{(selectedDocument.fileSize / 1024).toFixed(1)} KB</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Metadatos</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Creado:</span>
                      <span className="text-sm">
                        {new Date(selectedDocument.createdAt).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    {selectedDocument.filePath && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Ruta:</span>
                        <span className="text-sm font-mono text-xs">{selectedDocument.filePath}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedDocument.tags && (
                <div>
                  <h4 className="font-semibold mb-2">Etiquetas</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocument.tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedDocument.content && (
                <div>
                  <h4 className="font-semibold mb-2">Contenido</h4>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
                    {selectedDocument.content.length > 200 
                      ? `${selectedDocument.content.substring(0, 200)}...`
                      : selectedDocument.content
                    }
                  </p>
                </div>
              )}

              {selectedDocument.notes && (
                <div>
                  <h4 className="font-semibold mb-2">Notas</h4>
                  <p className="text-sm text-muted-foreground">{selectedDocument.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}