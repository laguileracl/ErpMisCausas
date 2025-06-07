import { Link, useLocation } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    {
      href: "/",
      icon: "fas fa-tachometer-alt",
      label: "Panel de Control",
      badge: null,
    },
    {
      href: "/causas",
      icon: "fas fa-gavel",
      label: "Causas Judiciales",
      badge: "12",
    },
    {
      href: "/clientes",
      icon: "fas fa-users",
      label: "Clientes",
      badge: null,
    },
    {
      href: "/empresas",
      icon: "fas fa-building",
      label: "Empresas",
      badge: null,
    },
    {
      href: "/contactos",
      icon: "fas fa-address-book",
      label: "Contactos",
      badge: null,
    },
    {
      href: "/providers",
      icon: "fas fa-handshake",
      label: "Proveedores",
      badge: null,
    },
    {
      href: "/courts",
      icon: "fas fa-university",
      label: "Tribunales",
      badge: null,
    },
  ];

  const managementItems = [
    {
      href: "/actividades",
      icon: "fas fa-clipboard-list",
      label: "Actividades",
      badge: null,
    },
    {
      href: "/documentos",
      icon: "fas fa-file-alt",
      label: "Documentos",
      badge: null,
    },
    {
      href: "/tareas",
      icon: "fas fa-tasks",
      label: "Tareas y Alarmas",
      badge: "5",
    },
    {
      href: "/notificaciones",
      icon: "fas fa-bell",
      label: "Notificaciones",
      badge: null,
    },
  ];

  const dataItems = [
    {
      href: "/importacion",
      icon: "fas fa-upload",
      label: "Importación CSV",
      badge: null,
    },
    {
      href: "/reportes",
      icon: "fas fa-chart-bar",
      label: "Reportes y Análisis",
      badge: null,
    },
  ];

  const adminItems = [
    {
      href: "/users",
      icon: "fas fa-user-cog",
      label: "Usuarios y Roles",
      badge: null,
    },
    {
      href: "/auditoria",
      icon: "fas fa-shield-alt",
      label: "Auditoría",
      badge: null,
    },
    {
      href: "/settings",
      icon: "fas fa-cog",
      label: "Configuración",
      badge: null,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/" || location === "/dashboard";
    }
    return location.startsWith(href);
  };

  const NavItem = ({ item }: { item: any }) => (
    <Link href={item.href}>
      <a
        className={cn(
          "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
          isActive(item.href)
            ? "bg-primary-50 text-primary-700"
            : "text-secondary-600 hover:bg-gray-50"
        )}
      >
        <i className={cn(item.icon, isCollapsed ? "mr-0" : "mr-3", "w-5")}></i>
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className={cn(
                "ml-auto text-xs px-2 py-1 rounded-full",
                item.badge === "5" 
                  ? "bg-red-500 text-white" 
                  : "bg-orange-500 text-white"
              )}>
                {item.badge}
              </span>
            )}
          </>
        )}
      </a>
    </Link>
  );

  return (
    <div className={cn(
      "fixed inset-y-0 left-0 z-50 bg-white shadow-lg transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <div className={cn("flex items-center", isCollapsed && "justify-center")}>
            <i className="fas fa-balance-scale text-primary-500 text-2xl"></i>
            {!isCollapsed && (
              <div className="ml-3">
                <h1 className="text-xl font-bold text-secondary-900">MisCausas.cl</h1>
                <p className="text-xs text-secondary-600">Sistema ERP Jurídico</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 h-8 w-8"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        <nav className={cn("flex-1 py-6 space-y-2 overflow-y-auto", isCollapsed ? "px-2" : "px-4")}>
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>

          {!isCollapsed && (
            <div className="pt-4 border-t border-gray-200">
              <p className="px-3 text-xs font-medium text-secondary-500 uppercase tracking-wider mb-2">
                Gestión
              </p>
              {managementItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          )}

          {isCollapsed && (
            <div className="pt-4 border-t border-gray-200 space-y-1">
              {managementItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          )}

          {!isCollapsed && (
            <div className="pt-4 border-t border-gray-200">
              <p className="px-3 text-xs font-medium text-secondary-500 uppercase tracking-wider mb-2">
                Datos y Reportes
              </p>
              {dataItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          )}

          {isCollapsed && (
            <div className="pt-4 border-t border-gray-200 space-y-1">
              {dataItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          )}

          {!isCollapsed && (
            <div className="pt-4 border-t border-gray-200">
              <p className="px-3 text-xs font-medium text-secondary-500 uppercase tracking-wider mb-2">
                Administración
              </p>
              {adminItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          )}

          {isCollapsed && (
            <div className="pt-4 border-t border-gray-200 space-y-1">
              {adminItems.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">JD</span>
              </div>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-900 truncate">
                Juan Domínguez
              </p>
              <p className="text-xs text-secondary-600 truncate">Abogado Senior</p>
            </div>
            <button className="ml-2 flex-shrink-0 text-secondary-400 hover:text-secondary-600">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
