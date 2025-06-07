# Railway Deployment Checklist - ERP MisCausas

## ✅ Pre-Deployment Checklist

### Preparación del Repositorio
- [ ] Repositorio GitHub configurado: `https://github.com/laguileracl/ErpMisCausas`
- [ ] Branch `main` actualizado con último código
- [ ] Archivos de configuración presentes:
  - [ ] `railway.json`
  - [ ] `Dockerfile`
  - [ ] `.github/workflows/deploy.yml`
  - [ ] `package.json` con scripts de build y start

### Configuración Railway
- [ ] Cuenta Railway creada y verificada
- [ ] Acceso autorizado a repositorio GitHub
- [ ] Proyecto Railway creado desde GitHub repo

## 🚀 Deployment Steps

### Paso 1: Configurar Servicios
- [ ] **Servicio Web**: Conectado a repositorio GitHub
- [ ] **PostgreSQL**: Base de datos agregada al proyecto
- [ ] **Variables copiadas**: DATABASE_URL del servicio PostgreSQL

### Paso 2: Variables de Entorno
```env
Configurar en Railway → Service → Variables:
```
- [ ] `NODE_ENV=production`
- [ ] `DATABASE_URL=[URL de PostgreSQL]`
- [ ] `JWT_SECRET=[32+ caracteres seguros]`
- [ ] `SESSION_SECRET=[32+ caracteres seguros]`

### Paso 3: Configuración Build
- [ ] Build Command: `npm run build`
- [ ] Start Command: `npm start`
- [ ] Auto-Deploy: Activado desde branch `main`

### Paso 4: Primer Deploy
- [ ] Deploy iniciado automáticamente
- [ ] Build completado sin errores (3-5 minutos)
- [ ] Servicio marcado como "Active"

### Paso 5: Dominio y Acceso
- [ ] Dominio Railway generado: `*.up.railway.app`
- [ ] Aplicación accesible via HTTPS
- [ ] Health check respondiendo: `/api/health`

## 🔍 Validación Post-Deploy

### Tests Funcionales
- [ ] **Login**: Crear cuenta de usuario exitosamente
- [ ] **Dashboard**: Página principal carga correctamente
- [ ] **Módulo Contable**: Acceso sin errores
- [ ] **Plan de Cuentas**: Crear nueva cuenta
- [ ] **Vouchers**: Crear comprobante contable
- [ ] **Causa Legal**: Crear nueva causa
- [ ] **Cuenta Provisoria**: Generar PDF individual
- [ ] **ZIP Múltiple**: Descargar archivo comprimido

### Tests de Performance
- [ ] **Carga inicial**: < 3 segundos
- [ ] **Navegación**: < 1 segundo entre páginas
- [ ] **PDF individual**: < 30 segundos
- [ ] **ZIP múltiple**: < 2 minutos (5 causas)
- [ ] **Base de datos**: Consultas < 500ms

### Tests de Seguridad
- [ ] **HTTPS**: Certificado SSL válido
- [ ] **Autenticación**: JWT funcionando
- [ ] **Sesiones**: Expiración correcta
- [ ] **API endpoints**: Requieren autenticación
- [ ] **Archivos**: PDF generados correctamente

## 🌐 Configuración Dominio Personalizado

### Prerequisitos
- [ ] Dominio `miscausas.cl` bajo tu control
- [ ] Acceso a configuración DNS

### Configuración Railway
- [ ] Railway → Settings → Domains
- [ ] Agregar dominio: `erp.miscausas.cl`
- [ ] Copiar valor CNAME proporcionado

### Configuración DNS
```dns
Agregar en tu proveedor DNS:
```
- [ ] **Tipo**: CNAME
- [ ] **Nombre**: erp
- [ ] **Valor**: [dominio proporcionado por Railway]
- [ ] **TTL**: 300 (5 minutos)

### Verificación
- [ ] Propagación DNS: 5-60 minutos
- [ ] SSL automático: Railway genera certificado
- [ ] Acceso: `https://erp.miscausas.cl` funcional

## 🔧 Configuración CI/CD (Opcional)

### GitHub Secrets
```
Repository → Settings → Secrets and variables → Actions
```
- [ ] `RAILWAY_TOKEN`: Token desde Railway Profile
- [ ] `RAILWAY_SERVICE_ID`: ID del servicio web

### Workflow Automático
- [ ] `.github/workflows/deploy.yml` configurado
- [ ] Push a `main` triggea deployment
- [ ] Tests automáticos antes de deploy

## 📊 Monitoreo Post-Deploy

### Métricas Railway
- [ ] **CPU Usage**: < 50% en operación normal
- [ ] **Memory Usage**: < 80% del límite
- [ ] **Response Time**: < 500ms promedio
- [ ] **Error Rate**: < 1%

### Health Checks
- [ ] **Endpoint**: `/api/health` responde
- [ ] **Database**: Conexión exitosa
- [ ] **PDF Service**: Puppeteer funcionando
- [ ] **File Generation**: ZIP creándose correctamente

### Logs y Debugging
- [ ] **Railway Logs**: Sin errores críticos
- [ ] **Database Logs**: Conexiones estables
- [ ] **Application Logs**: Errores manejados

## 🚨 Troubleshooting

### Build Failures
```bash
Errores comunes y soluciones:
```
- [ ] **Dependencies**: Verificar package.json
- [ ] **TypeScript**: Compilación sin errores
- [ ] **Environment**: Variables configuradas

### Runtime Errors
- [ ] **Database**: CONNECTION_URL válida
- [ ] **Memory**: Sufficient for PDF generation
- [ ] **Chromium**: Puppeteer dependencies

### Performance Issues
- [ ] **Database**: Índices optimizados
- [ ] **Files**: Cleanup de archivos temporales
- [ ] **Memory**: Monitoring de uso

## 📞 Contactos de Soporte

### Railway Support
- **Dashboard**: railway.app/help
- **Discord**: Railway Community
- **Documentation**: docs.railway.app

### ERP MisCausas Support
- **Repository**: github.com/laguileracl/ErpMisCausas
- **Issues**: GitHub Issues tab
- **Documentation**: Archivos .md en repositorio

## 📋 Post-Deploy Actions

### Immediate (Día 1)
- [ ] Validar todas las funciones críticas
- [ ] Configurar dominio personalizado
- [ ] Documentar URLs y credenciales
- [ ] Backup inicial de base de datos

### Short-term (Semana 1)
- [ ] Monitorear performance y logs
- [ ] Configurar alertas de Railway
- [ ] Training del equipo con manual de usuario
- [ ] Tests de carga con usuarios reales

### Long-term (Mes 1)
- [ ] Optimizar queries de base de datos
- [ ] Implementar backup automático
- [ ] Configurar monitoring avanzado
- [ ] Plan de escalamiento según uso

---

**Deployment Target**: https://erp-miscausas-production.up.railway.app  
**Custom Domain**: https://erp.miscausas.cl  
**Health Check**: https://erp.miscausas.cl/api/health  

**Status**: ✅ Production Ready