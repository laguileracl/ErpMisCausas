import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, User, Building2, Phone, Mail, MapPin, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertContactSchema, insertCompanyContactSchema, type Contact, type Company, type CompanyContact, type InsertContact, type InsertCompanyContact } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ContactosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showCompanyAssignment, setShowCompanyAssignment] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["/api/contacts"],
  });

  const { data: companies = [] } = useQuery({
    queryKey: ["/api/companies"],
  });

  const { data: contactCompanies = [] } = useQuery({
    queryKey: ["/api/contacts", selectedContact?.id, "companies"],
    queryFn: () => selectedContact 
      ? apiRequest(`/api/contacts/${selectedContact.id}/companies`)
      : Promise.resolve([]),
    enabled: !!selectedContact,
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertContact) => apiRequest("/api/contacts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Contacto creado",
        description: "El contacto ha sido creado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el contacto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<InsertContact> }) =>
      apiRequest(`/api/contacts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setEditingContact(null);
      toast({
        title: "Contacto actualizado",
        description: "El contacto ha sido actualizado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el contacto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/contacts/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      toast({
        title: "Contacto eliminado",
        description: "El contacto ha sido eliminado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el contacto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const assignCompanyMutation = useMutation({
    mutationFn: (data: InsertCompanyContact) => apiRequest("/api/company-contacts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", selectedContact?.id, "companies"] });
      setShowCompanyAssignment(false);
      toast({
        title: "Empresa asignada",
        description: "La empresa ha sido asignada al contacto exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo asignar la empresa. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const removeCompanyMutation = useMutation({
    mutationFn: (relationshipId: number) => apiRequest(`/api/company-contacts/${relationshipId}`, {
      method: "DELETE",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts", selectedContact?.id, "companies"] });
      toast({
        title: "Empresa desvinculada",
        description: "La empresa ha sido desvinculada del contacto.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo desvincular la empresa. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const filteredContacts = contacts.filter((contact: Contact) =>
    `${contact.firstName} ${contact.lastName} ${contact.email || ''} ${contact.position || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const form = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      notes: "",
      isActive: true,
    },
  });

  const editForm = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
  });

  const companyForm = useForm<InsertCompanyContact>({
    resolver: zodResolver(insertCompanyContactSchema),
    defaultValues: {
      contactId: selectedContact?.id || 0,
      companyId: 0,
      role: "",
      isPrimary: false,
      isActive: true,
      notes: "",
    },
  });

  const onSubmit = (data: InsertContact) => {
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const onAssignCompany = (data: InsertCompanyContact) => {
    assignCompanyMutation.mutate({
      ...data,
      contactId: selectedContact!.id,
    });
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    editForm.reset({
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email || "",
      phone: contact.phone || "",
      position: contact.position || "",
      notes: contact.notes || "",
      isActive: contact.isActive,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este contacto?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleRemoveCompany = (relationshipId: number) => {
    if (confirm("¿Estás seguro de que deseas desvincular esta empresa del contacto?")) {
      removeCompanyMutation.mutate(relationshipId);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Contactos</h1>
          <p className="text-muted-foreground">
            Administra personas de contacto y sus relaciones con empresas
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => form.reset()}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Contacto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Contacto</DialogTitle>
              <DialogDescription>
                Ingresa los datos del nuevo contacto
              </DialogDescription>
            </DialogHeader>
            <ContactForm 
              form={form} 
              onSubmit={onSubmit} 
              isLoading={createMutation.isPending} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList>
          <TabsTrigger value="list">Lista de Contactos</TabsTrigger>
          {selectedContact && (
            <TabsTrigger value="detail">
              Detalle: {selectedContact.firstName} {selectedContact.lastName}
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="list">
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contactos por nombre, email o cargo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {isLoading ? (
            <div className="text-center py-8">Cargando contactos...</div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredContacts.map((contact: Contact) => (
                <Card key={contact.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="h-5 w-5 text-blue-600" />
                        <Badge variant={contact.isActive ? "default" : "secondary"}>
                          {contact.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedContact(contact)}
                        >
                          <Building2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(contact)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(contact.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg">
                      {contact.firstName} {contact.lastName}
                    </CardTitle>
                    {contact.position && (
                      <CardDescription className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {contact.position}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {contact.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {contact.email}
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {contact.phone}
                        </div>
                      )}
                      {contact.notes && (
                        <div>
                          <span className="font-medium">Notas:</span> {contact.notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="detail">
          {selectedContact && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {selectedContact.firstName} {selectedContact.lastName}
                  </CardTitle>
                  <CardDescription>
                    Información detallada del contacto y empresas asociadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedContact.email && (
                      <div>
                        <span className="font-medium">Email:</span> {selectedContact.email}
                      </div>
                    )}
                    {selectedContact.phone && (
                      <div>
                        <span className="font-medium">Teléfono:</span> {selectedContact.phone}
                      </div>
                    )}
                    {selectedContact.position && (
                      <div>
                        <span className="font-medium">Cargo:</span> {selectedContact.position}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Estado:</span>{" "}
                      <Badge variant={selectedContact.isActive ? "default" : "secondary"}>
                        {selectedContact.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                  {selectedContact.notes && (
                    <div className="mt-4">
                      <span className="font-medium">Notas:</span>
                      <p className="text-muted-foreground mt-1">{selectedContact.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Empresas Asociadas
                      </CardTitle>
                      <CardDescription>
                        Empresas donde trabaja o está vinculado este contacto
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowCompanyAssignment(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Vincular Empresa
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {contactCompanies.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No hay empresas asociadas a este contacto
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {contactCompanies.map((company: Company & { relationship: CompanyContact }) => (
                        <div key={company.relationship.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{company.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {company.relationship.role && `${company.relationship.role} • `}
                              {company.relationship.isPrimary && "Contacto Principal • "}
                              {company.type.toUpperCase()}
                            </p>
                            {company.relationship.notes && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {company.relationship.notes}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCompany(company.relationship.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Contact Modal */}
      <Dialog open={!!editingContact} onOpenChange={() => setEditingContact(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Contacto</DialogTitle>
            <DialogDescription>
              Modifica los datos del contacto
            </DialogDescription>
          </DialogHeader>
          <ContactForm 
            form={editForm} 
            onSubmit={onSubmit} 
            isLoading={updateMutation.isPending} 
          />
        </DialogContent>
      </Dialog>

      {/* Company Assignment Modal */}
      <Dialog open={showCompanyAssignment} onOpenChange={setShowCompanyAssignment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Empresa</DialogTitle>
            <DialogDescription>
              Asocia este contacto con una empresa
            </DialogDescription>
          </DialogHeader>
          <Form {...companyForm}>
            <form onSubmit={companyForm.handleSubmit(onAssignCompany)} className="space-y-4">
              <FormField
                control={companyForm.control}
                name="companyId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una empresa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {companies.map((company: Company) => (
                          <SelectItem key={company.id} value={company.id.toString()}>
                            {company.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={companyForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo en la Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Gerente, Director, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={companyForm.control}
                name="isPrimary"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Contacto Principal</FormLabel>
                      <FormDescription>
                        ¿Es el contacto principal de esta empresa?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={companyForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas de la Relación</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detalles específicos de esta relación laboral"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCompanyAssignment(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={assignCompanyMutation.isPending}>
                  {assignCompanyMutation.isPending ? "Vinculando..." : "Vincular Empresa"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactForm({ 
  form, 
  onSubmit, 
  isLoading 
}: { 
  form: any; 
  onSubmit: (data: InsertContact) => void; 
  isLoading: boolean; 
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Ingresa el nombre" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Ingresa el apellido" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="position"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cargo / Profesión</FormLabel>
              <FormControl>
                <Input placeholder="Gerente, Abogado, etc." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="correo@ejemplo.com" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="+56 9 1234 5678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notas</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Notas adicionales sobre el contacto"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Contacto Activo</FormLabel>
                <FormDescription>
                  ¿El contacto está activo en el sistema?
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar Contacto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}