import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Eye, Calculator, FileText, DollarSign, Download, Check, X, Clock } from "lucide-react";

// Form schemas
const accountSchema = z.object({
  code: z.string().min(1, "Código es requerido"),
  name: z.string().min(1, "Nombre es requerido"),
  type: z.string().min(1, "Tipo es requerido"),
  category: z.string().min(1, "Categoría es requerida"),
  parentId: z.coerce.number().optional(),
  description: z.string().optional(),
});

const voucherSchema = z.object({
  legalCaseId: z.coerce.number().optional(),
  contactId: z.coerce.number().optional(),
  companyId: z.coerce.number().optional(),
  documentType: z.string().min(1, "Tipo de documento es requerido"),
  folioNumber: z.string().min(1, "Número de folio es requerido"),
  issueDate: z.string().min(1, "Fecha es requerida"),
  description: z.string().min(1, "Descripción es requerida"),
  comments: z.string().optional(),
  subtotal: z.coerce.number().min(0, "Subtotal debe ser mayor a 0"),
  taxAmount: z.coerce.number().min(0, "Monto de impuesto debe ser mayor o igual a 0"),
  total: z.coerce.number().min(0, "Total debe ser mayor a 0"),
});

export default function ContabilidadPage() {
  const { toast } = useToast();
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [voucherDialogOpen, setVoucherDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);

  // Queries
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["/api/accounts"],
  });

  const { data: vouchers = [], isLoading: vouchersLoading } = useQuery({
    queryKey: ["/api/vouchers"],
  });

  // Account mutations
  const createAccountMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setAccountDialogOpen(false);
      toast({ title: "Cuenta creada exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al crear cuenta", variant: "destructive" });
    },
  });

  const updateAccountMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/accounts/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      setAccountDialogOpen(false);
      setSelectedAccount(null);
      toast({ title: "Cuenta actualizada exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al actualizar cuenta", variant: "destructive" });
    },
  });

  // Voucher mutations
  const createVoucherMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/vouchers", {
      method: "POST",
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      setVoucherDialogOpen(false);
      toast({ title: "Comprobante creado exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al crear comprobante", variant: "destructive" });
    },
  });

  const updateVoucherMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/vouchers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vouchers"] });
      setVoucherDialogOpen(false);
      setSelectedVoucher(null);
      toast({ title: "Comprobante actualizado exitosamente" });
    },
    onError: () => {
      toast({ title: "Error al actualizar comprobante", variant: "destructive" });
    },
  });

  // Forms
  const accountForm = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      code: "",
      name: "",
      type: "",
      category: "",
      parentId: undefined,
      description: "",
    },
  });

  const voucherForm = useForm({
    resolver: zodResolver(voucherSchema),
    defaultValues: {
      legalCaseId: undefined,
      contactId: undefined,
      companyId: undefined,
      documentType: "",
      folioNumber: "",
      issueDate: "",
      description: "",
      comments: "",
      subtotal: 0,
      taxAmount: 0,
      total: 0,
    },
  });

  // Event handlers
  const onAccountSubmit = (data: any) => {
    if (selectedAccount) {
      updateAccountMutation.mutate({ id: selectedAccount.id, data });
    } else {
      createAccountMutation.mutate(data);
    }
  };

  const onVoucherSubmit = (data: any) => {
    if (selectedVoucher) {
      updateVoucherMutation.mutate({ id: selectedVoucher.id, data });
    } else {
      createVoucherMutation.mutate(data);
    }
  };

  const openAccountDialog = (account: any = null) => {
    setSelectedAccount(account);
    if (account) {
      accountForm.reset(account);
    } else {
      accountForm.reset({
        code: "",
        name: "",
        type: "",
        category: "",
        parentId: undefined,
        description: "",
      });
    }
    setAccountDialogOpen(true);
  };

  const openVoucherDialog = (voucher: any = null) => {
    setSelectedVoucher(voucher);
    if (voucher) {
      voucherForm.reset(voucher);
    } else {
      voucherForm.reset({
        legalCaseId: undefined,
        contactId: undefined,
        companyId: undefined,
        documentType: "",
        folioNumber: "",
        issueDate: "",
        description: "",
        comments: "",
        subtotal: 0,
        taxAmount: 0,
        total: 0,
      });
    }
    setVoucherDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", label: "Pendiente" },
      paid: { variant: "default", label: "Pagado" },
      posted: { variant: "destructive", label: "Contabilizado" },
    };
    const statusConfig = variants[status] || { variant: "outline", label: status };
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contabilidad</h1>
          <p className="text-muted-foreground">
            Gestión del plan de cuentas y comprobantes contables
          </p>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Plan de Cuentas
          </TabsTrigger>
          <TabsTrigger value="vouchers" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Comprobantes
          </TabsTrigger>
          <TabsTrigger value="cuenta-provisoria" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Cuenta Provisoria
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Reportes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Plan de Cuentas</CardTitle>
                  <CardDescription>
                    Gestiona el catálogo de cuentas contables
                  </CardDescription>
                </div>
                <Button onClick={() => openAccountDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Cuenta
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {accountsLoading ? (
                <div className="text-center py-4">Cargando cuentas...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account: any) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-mono">{account.code}</TableCell>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{account.type}</Badge>
                        </TableCell>
                        <TableCell>{account.category}</TableCell>
                        <TableCell>
                          <Badge variant={account.isActive ? "default" : "secondary"}>
                            {account.isActive ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAccountDialog(account)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vouchers">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Comprobantes Contables</CardTitle>
                  <CardDescription>
                    Gestiona los comprobantes y documentos contables
                  </CardDescription>
                </div>
                <Button onClick={() => openVoucherDialog()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Comprobante
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {vouchersLoading ? (
                <div className="text-center py-4">Cargando comprobantes...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Folio</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vouchers.map((voucher: any) => (
                      <TableRow key={voucher.id}>
                        <TableCell className="font-mono">{voucher.voucherNumber}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{voucher.documentType}</Badge>
                        </TableCell>
                        <TableCell>{voucher.folioNumber}</TableCell>
                        <TableCell>{voucher.issueDate}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {voucher.description}
                        </TableCell>
                        <TableCell className="font-mono">
                          {formatCurrency(voucher.total)}
                        </TableCell>
                        <TableCell>{getStatusBadge(voucher.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openVoucherDialog(voucher)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reportes Contables</CardTitle>
              <CardDescription>
                Genera reportes financieros y contables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Estado de Resultados</CardTitle>
                    <CardDescription>Ingresos y gastos del período</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Generar Reporte</Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Balance General</CardTitle>
                    <CardDescription>Activos, pasivos y patrimonio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Generar Reporte</Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cuenta Provisoria</CardTitle>
                    <CardDescription>Reporte especial para tribunales</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">Generar PDF</Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Account Dialog */}
      <Dialog open={accountDialogOpen} onOpenChange={setAccountDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedAccount ? "Editar Cuenta" : "Nueva Cuenta"}
            </DialogTitle>
            <DialogDescription>
              {selectedAccount ? "Modifica los datos de la cuenta contable" : "Crea una nueva cuenta en el plan de cuentas"}
            </DialogDescription>
          </DialogHeader>
          <Form {...accountForm}>
            <form onSubmit={accountForm.handleSubmit(onAccountSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={accountForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código</FormLabel>
                      <FormControl>
                        <Input placeholder="1.1.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={accountForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre de la cuenta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={accountForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="asset">Activo</SelectItem>
                          <SelectItem value="liability">Pasivo</SelectItem>
                          <SelectItem value="equity">Patrimonio</SelectItem>
                          <SelectItem value="income">Ingreso</SelectItem>
                          <SelectItem value="expense">Gasto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={accountForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <FormControl>
                        <Input placeholder="Categoría contable" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={accountForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descripción de la cuenta..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setAccountDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createAccountMutation.isPending || updateAccountMutation.isPending}
                >
                  {selectedAccount ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Voucher Dialog */}
      <Dialog open={voucherDialogOpen} onOpenChange={setVoucherDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedVoucher ? "Editar Comprobante" : "Nuevo Comprobante"}
            </DialogTitle>
            <DialogDescription>
              {selectedVoucher ? "Modifica los datos del comprobante" : "Crea un nuevo comprobante contable"}
            </DialogDescription>
          </DialogHeader>
          <Form {...voucherForm}>
            <form onSubmit={voucherForm.handleSubmit(onVoucherSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={voucherForm.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Documento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="boleta">Boleta</SelectItem>
                          <SelectItem value="factura">Factura</SelectItem>
                          <SelectItem value="voucher">Voucher</SelectItem>
                          <SelectItem value="nota_credito">Nota de Crédito</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={voucherForm.control}
                  name="folioNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Folio</FormLabel>
                      <FormControl>
                        <Input placeholder="12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={voucherForm.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Emisión</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={voucherForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input placeholder="Descripción del comprobante" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={voucherForm.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentarios</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Comentarios adicionales..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={voucherForm.control}
                  name="subtotal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtotal</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={voucherForm.control}
                  name="taxAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IVA</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={voucherForm.control}
                  name="total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setVoucherDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createVoucherMutation.isPending || updateVoucherMutation.isPending}
                >
                  {selectedVoucher ? "Actualizar" : "Crear"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}