# MisCausas.cl - Sistema ERP Jurídico

Sistema integral de gestión para estudios jurídicos que incluye manejo de causas, clientes, documentos, contabilidad y reportes especializados.

## 🚀 Características Principales

### Módulos Implementados
- ✅ **Gestión de Causas Judiciales**: Seguimiento completo de casos legales
- ✅ **Gestión de Clientes y Empresas**: Base de datos de clientes corporativos e individuales
- ✅ **Gestión de Contactos**: Directorio de contactos profesionales
- ✅ **Sistema de Tareas y Actividades**: Seguimiento de actividades y plazos
- ✅ **Gestión Documental**: Almacenamiento y organización de documentos
- ✅ **Sistema de Notificaciones**: Alertas automáticas y notificaciones por email
- ✅ **Módulo Contable Completo**: Plan de cuentas, comprobantes, y reportes contables
- ✅ **Sistema de Auditoría**: Registro completo de actividades del sistema
- ✅ **Seguridad Avanzada**: Autenticación, sesiones seguras, y logging de seguridad
- ✅ **Importación de Datos**: Carga masiva vía archivos CSV
- ✅ **Reportes y Dashboard**: Análisis y visualización de datos

### Características Técnicas
- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Base de Datos**: PostgreSQL + Drizzle ORM
- **Autenticación**: JWT + bcrypt + sesiones seguras
- **API**: RESTful API con validación Zod
- **UI**: Interfaz moderna y responsiva
- **Estado**: TanStack Query para manejo de estado del servidor

## 📁 Estructura del Proyecto

```
miscausas-erp/
├── client/                     # Frontend React
│   ├── src/
│   │   ├── components/         # Componentes UI reutilizables
│   │   │   ├── ui/            # Componentes base (shadcn/ui)
│   │   │   └── layout/        # Componentes de layout (sidebar, topbar)
│   │   ├── pages/             # Páginas de la aplicación
│   │   │   ├── dashboard.tsx  # Panel principal
│   │   │   ├── causas.tsx     # Gestión de causas
│   │   │   ├── clientes.tsx   # Gestión de clientes
│   │   │   ├── empresas.tsx   # Gestión de empresas
│   │   │   ├── contactos.tsx  # Gestión de contactos
│   │   │   ├── contabilidad.tsx # Módulo contable
│   │   │   ├── documentos.tsx # Gestión documental
│   │   │   ├── tareas.tsx     # Tareas y actividades
│   │   │   ├── reportes.tsx   # Reportes y análisis
│   │   │   └── ...
│   │   ├── lib/               # Utilidades y configuración
│   │   │   ├── auth.tsx       # Sistema de autenticación
│   │   │   ├── queryClient.ts # Configuración TanStack Query
│   │   │   └── utils.ts       # Utilidades generales
│   │   ├── hooks/             # Hooks personalizados
│   │   └── App.tsx            # Componente raíz
│   └── index.html             # Punto de entrada HTML
├── server/                     # Backend Node.js
│   ├── index.ts               # Servidor principal
│   ├── routes.ts              # Rutas de la API
│   ├── storage.ts             # Capa de almacenamiento
│   ├── db.ts                  # Configuración de base de datos
│   ├── accounting-service.ts  # Servicio contable
│   ├── notification-service.ts # Servicio de notificaciones
│   ├── security-service.ts    # Servicio de seguridad
│   ├── seed.ts               # Datos de prueba
│   └── seed-accounting.ts    # Datos contables de prueba
├── shared/                    # Código compartido
│   └── schema.ts             # Esquemas de base de datos (Drizzle)
├── package.json              # Dependencias del proyecto
├── drizzle.config.ts         # Configuración Drizzle ORM
├── vite.config.ts            # Configuración Vite
├── tailwind.config.ts        # Configuración Tailwind CSS
└── tsconfig.json             # Configuración TypeScript
```

## 🛠️ Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone https://github.com/[usuario]/miscausas-erp.git
cd miscausas-erp
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crear archivo `.env` en la raíz del proyecto:
```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/miscausas_erp
JWT_SECRET=tu_jwt_secret_muy_seguro
NODE_ENV=development
PORT=5000

# Configuración de email (opcional para notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_de_aplicacion
```

### 4. Configurar base de datos
```bash
# Crear base de datos PostgreSQL
createdb miscausas_erp

# Ejecutar migraciones
npm run db:push

# Cargar datos de prueba (opcional)
npm run seed
```

### 5. Ejecutar en desarrollo
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5000`

## 📊 Módulo Contable

### Plan de Cuentas
El sistema incluye un plan de cuentas completo adaptado a la legislación chilena:

#### Activos (Código 1.x.x)
- **1.1.x**: Efectivo y equivalentes (Caja, Bancos)
- **1.2.x**: Cuentas por cobrar
- **1.3.x**: Activos fijos (Muebles, equipos)

#### Pasivos (Código 2.x.x)
- **2.1.x**: Cuentas por pagar (Proveedores)
- **2.2.x**: Impuestos (IVA Débito/Crédito Fiscal)

#### Patrimonio (Código 3.x.x)
- **3.1.x**: Capital
- **3.2.x**: Utilidades retenidas

#### Ingresos (Código 4.x.x)
- **4.1.x**: Honorarios profesionales
- **4.2.x**: Ventas de bienes
- **4.3.x**: Intereses ganados
- **4.9.x**: Otros ingresos

#### Gastos (Código 5.x.x)
- **5.1.x**: Gastos operacionales
- **5.2.x**: Honorarios de terceros
- **5.9.x**: Otros gastos

### Funcionalidades Contables
- ✅ Gestión completa del plan de cuentas
- ✅ Creación y edición de comprobantes contables
- ✅ Asientos de diario con débitos y créditos
- ✅ Validación automática de balances
- ✅ Reportes financieros básicos
- 🔄 **En desarrollo**: Generación de PDFs "Cuenta Provisoria"
- 🔄 **En desarrollo**: Reportes de Estado de Resultados y Balance General

## 🔐 Seguridad

### Características Implementadas
- **Autenticación JWT**: Tokens seguros con expiración
- **Hash de contraseñas**: bcrypt con salt rounds configurables
- **Gestión de sesiones**: Control de sesiones activas y timeouts
- **Logging de seguridad**: Registro completo de eventos de seguridad
- **Bloqueo por intentos**: Protección contra ataques de fuerza bruta
- **Auditoría completa**: Tracking de todas las operaciones del sistema

## 📧 Sistema de Notificaciones

### Tipos de Notificaciones
- **Tareas vencidas**: Alertas automáticas por tareas no completadas
- **Actualizaciones de causas**: Notificaciones por cambios en casos
- **Nuevas actividades**: Alertas por actividades asignadas
- **Recordatorios**: Sistema configurable de recordatorios

### Canales de Notificación
- **En aplicación**: Notificaciones en tiempo real en la interfaz
- **Email**: Envío automático de emails con plantillas personalizadas
- **Preferencias de usuario**: Control granular de tipos de notificaciones

## 🚀 Despliegue

### Despliegue en Producción

#### 1. Variables de Entorno de Producción
```env
NODE_ENV=production
DATABASE_URL=postgresql://usuario:password@host:5432/miscausas_erp_prod
JWT_SECRET=secret_muy_seguro_para_produccion
PORT=5000
```

#### 2. Build de Producción
```bash
npm run build
npm start
```

#### 3. Despliegue con Docker (Opcional)
```dockerfile
# Dockerfile de ejemplo
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Coverage de tests
npm run test:coverage
```

## 📋 Roadmap de Desarrollo

### Próximas Características Prioritarias

#### 1. Generación de PDFs "Cuenta Provisoria" 📄
- **Objetivo**: Reportes PDF especializados para tribunales
- **Formato**: ROL + nombre_deudor + mes + año.pdf
- **Características**:
  - Formato de una página
  - Datos específicos por causa judicial
  - Generación individual y masiva
  - Empaquetado en ZIP para múltiples causas

#### 2. Reportes Contables Avanzados 📊
- Estado de Resultados detallado
- Balance General clasificado
- Flujo de efectivo
- Análisis de cuentas por cobrar/pagar

#### 3. Integración con SII 🏛️
- Conexión con API del SII
- Descarga automática de documentos tributarios
- Validación de RUTs y datos fiscales

#### 4. Gestión Avanzada de Documentos 📁
- OCR para digitalización automática
- Versionado de documentos
- Firmas digitales
- Workflows de aprobación

#### 5. Mobile App 📱
- Aplicación móvil para consultas
- Notificaciones push
- Acceso offline limitado

### Mejoras Técnicas Planificadas
- Tests unitarios y de integración
- CI/CD con GitHub Actions
- Monitoreo y logging avanzado
- Optimización de performance
- Implementación de caché

## 🤝 Contribución

### Estructura de Commits
```
feat: agregar nueva funcionalidad
fix: corregir bug
docs: actualizar documentación
style: cambios de formato
refactor: refactorización de código
test: agregar o modificar tests
```

### Flujo de Desarrollo
1. Fork del repositorio
2. Crear rama feature: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'feat: agregar nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📞 Soporte

Para soporte técnico o consultas sobre el sistema:
- **Email**: soporte@miscausas.cl
- **Documentación**: [Wiki del proyecto](link-a-wiki)
- **Issues**: [GitHub Issues](link-a-issues)

## 📄 Licencia

Este proyecto está bajo licencia MIT. Ver archivo `LICENSE` para más detalles.

---

**MisCausas.cl** - Sistema ERP Jurídico Integral
Desarrollado con ❤️ para estudios jurídicos modernos