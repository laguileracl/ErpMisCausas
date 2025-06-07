import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Clientes from "@/pages/clientes";
import Empresas from "@/pages/empresas";
import Contactos from "@/pages/contactos";
import Causas from "@/pages/causas";
import Actividades from "@/pages/actividades";
import Documentos from "@/pages/documentos";
import Tareas from "@/pages/tareas";
import Auditoria from "@/pages/auditoria";
import Importacion from "@/pages/importacion";
import Reportes from "@/pages/reportes";
import { useAuth, AuthProvider } from "@/lib/auth";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-secondary-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/login" component={Login} />
        <Route component={Login} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/clientes" component={Clientes} />
      <Route path="/empresas" component={Empresas} />
      <Route path="/contactos" component={Contactos} />
      <Route path="/causas" component={Causas} />
      <Route path="/actividades" component={Actividades} />
      <Route path="/documentos" component={Documentos} />
      <Route path="/tareas" component={Tareas} />
      <Route path="/auditoria" component={Auditoria} />
      <Route path="/importacion" component={Importacion} />
      <Route path="/reportes" component={Reportes} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
