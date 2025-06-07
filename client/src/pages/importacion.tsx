import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Download, FileText, Users, Building, UserCheck, AlertCircle, CheckCircle, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface ImportResult {
  success: number;
  errors: Array<{
    row: any;
    error: string;
  }>;
}

export default function ImportacionPage() {
  const [activeTab, setActiveTab] = useState("clientes");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for importing data
  const importMutation = useMutation({
    mutationFn: async ({ type, file }: { type: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`/api/import/${type}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Error al importar datos');
      }
      
      return response.json();
    },
    onSuccess: (data: ImportResult) => {
      setImportResults(data);
      setIsImporting(false);
      setUploadProgress(100);
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/companies'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      
      toast({
        title: "Importación completada",
        description: `${data.success} registros importados exitosamente`,
      });
    },
    onError: (error: any) => {
      setIsImporting(false);
      setUploadProgress(0);
      toast({
        title: "Error en la importación",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = async (file: File, type: string) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo CSV válido",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResults(null);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    importMutation.mutate({ type, file });
  };

  const downloadTemplate = async (type: string) => {
    try {
      const response = await fetch(`/api/templates/${type}`);
      if (!response.ok) throw new Error('Error al descargar plantilla');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `plantilla_${type}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Plantilla descargada",
        description: `Plantilla de ${type} descargada exitosamente`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al descargar plantilla",
        variant: "destructive",
      });
    }
  };

  const ImportSection = ({ 
    type, 
    title, 
    description, 
    icon: Icon 
  }: { 
    type: string; 
    title: string; 
    description: string; 
    icon: any;
  }) => (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Icon className="h-6 w-6 text-blue-600" />
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Descargar Plantilla
            </CardTitle>
            <CardDescription>
              Descarga la plantilla CSV con el formato requerido
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => downloadTemplate(type)}
              variant="outline" 
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla CSV
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Importar Datos
            </CardTitle>
            <CardDescription>
              Sube tu archivo CSV con los datos a importar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <Label htmlFor={`file-${type}`}>Archivo CSV</Label>
                <Input
                  id={`file-${type}`}
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, type);
                  }}
                  disabled={isImporting}
                />
              </div>
              
              {isImporting && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Procesando archivo...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importación Masiva</h1>
        <p className="text-muted-foreground">
          Importa datos masivamente usando archivos CSV
        </p>
      </div>

      {/* Resultados de importación */}
      {importResults && (
        <Alert className={importResults.errors.length === 0 ? "border-green-500" : "border-orange-500"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Registros importados: {importResults.success}</span>
              </div>
              {importResults.errors.length > 0 && (
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-600" />
                  <span>Errores encontrados: {importResults.errors.length}</span>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Errores detallados */}
      {importResults && importResults.errors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Errores de Importación</CardTitle>
            <CardDescription>
              Los siguientes registros no pudieron ser importados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {importResults.errors.map((error, index) => (
                <div key={index} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                  <div className="font-medium text-red-800">Fila {index + 2}:</div>
                  <div className="text-red-600">{error.error}</div>
                  <div className="text-xs text-red-500 mt-1">
                    Datos: {JSON.stringify(error.row)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="companies">Empresas</TabsTrigger>
          <TabsTrigger value="contacts">Contactos</TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="space-y-6">
          <ImportSection
            type="clients"
            title="Importación de Clientes"
            description="Importa clientes individuales con sus datos personales"
            icon={Users}
          />
        </TabsContent>

        <TabsContent value="companies" className="space-y-6">
          <ImportSection
            type="companies"
            title="Importación de Empresas"
            description="Importa empresas y organizaciones con sus datos corporativos"
            icon={Building}
          />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <ImportSection
            type="contacts"
            title="Importación de Contactos"
            description="Importa contactos asociados a empresas existentes"
            icon={UserCheck}
          />
        </TabsContent>
      </Tabs>

      {/* Instrucciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Instrucciones de Uso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold">Pasos para importar datos:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Descarga la plantilla CSV correspondiente</li>
                <li>Completa los datos en el archivo descargado</li>
                <li>Guarda el archivo en formato CSV (UTF-8)</li>
                <li>Sube el archivo usando el botón de importación</li>
              </ol>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Consideraciones importantes:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Los archivos deben estar en formato CSV</li>
                <li>Respeta el formato de las columnas</li>
                <li>Los campos obligatorios no pueden estar vacíos</li>
                <li>Revisa los errores antes de corregir e importar nuevamente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}