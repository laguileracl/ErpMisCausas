import { Link, useLocation } from "wouter";

export function Sidebar() {
  const [location] = useLocation();

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
  ];

  const adminItems = [
    {
      href: "/users",
      icon: "fas fa-user-cog",
      label: "Usuarios y Roles",
      badge: null,
    },
    {
      href: "/audit",
      icon: "fas fa-clipboard-list",
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
        className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
          isActive(item.href)
            ? "bg-primary-50 text-primary-700"
            : "text-secondary-600 hover:bg-gray-50"
        }`}
      >
        <i className={`${item.icon} mr-3 w-5`}></i>
        {item.label}
        {item.badge && (
          <span className={`ml-auto text-xs px-2 py-1 rounded-full ${
            item.badge === "5" 
              ? "bg-red-500 text-white" 
              : "bg-orange-500 text-white"
          }`}>
            {item.badge}
          </span>
        )}
      </a>
    </Link>
  );

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transition-all duration-300">
      <div className="flex flex-col h-full">
        <div className="flex items-center px-6 py-4 border-b border-gray-200">
          <div className="flex items-center">
            <i className="fas fa-balance-scale text-primary-500 text-2xl mr-3"></i>
            <div>
              <h1 className="text-xl font-bold text-secondary-900">MisCausas.cl</h1>
              <p className="text-xs text-secondary-600">Sistema ERP Jurídico</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="px-3 text-xs font-medium text-secondary-500 uppercase tracking-wider mb-2">
              Gestión
            </p>
            {managementItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="px-3 text-xs font-medium text-secondary-500 uppercase tracking-wider mb-2">
              Administración
            </p>
            {adminItems.map((item) => (
              <NavItem key={item.href} item={item} />
            ))}
          </div>
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
