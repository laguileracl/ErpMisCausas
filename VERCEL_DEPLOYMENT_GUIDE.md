# Guía de Deployment en Vercel - ERP MisCausas

## Configuración Completa para Deploy Automático

### 1. Archivos de Configuración Creados

#### `vercel.json`
```json
{
  "buildCommand": "./build.sh",
  "outputDirectory": "client/dist",
  "installCommand": "npm install",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://erp-miscausas-production.up.railway.app"
  }
}
```

#### `build.sh`
Script de build optimizado para Vercel que compila solo el frontend.

#### `.env.production`
Variables de entorno para producción con la URL de Railway API.

### 2. Configuración del Frontend

El `client/src/lib/queryClient.ts` ha sido modificado para:
- En desarrollo: usar API local (localhost:5000)
- En producción: usar API de Railway automáticamente

### 3. Pasos para Deploy en Vercel

1. **Conectar Repositorio:**
   - Ve a [vercel.com](https://vercel.com)
   - Importa el repositorio: `https://github.com/laguileracl/ErpMisCausas`
   - Selecciona el framework: Vite

2. **Configuración del Proyecto:**
   - Vercel detectará automáticamente la configuración de `vercel.json`
   - El build command será: `./build.sh`
   - El output directory será: `client/dist`

3. **Variables de Entorno (ya configuradas):**
   - `VITE_API_URL`: https://erp-miscausas-production.up.railway.app

4. **Deploy Automático:**
   - Cada push a `main` activará un deploy automático
   - El dominio temporal será: `erp-miscausas.vercel.app` o similar

### 4. Conexión API

El frontend se conectará automáticamente a:
- **Backend Railway**: https://erp-miscausas-production.up.railway.app
- **Credenciales de prueba**: admin / admin123

### 5. URLs Finales

- **Backend (Railway)**: https://erp-miscausas-production.up.railway.app
- **Frontend (Vercel)**: https://erp-miscausas.vercel.app (temporal)
- **Dominio final**: erp.miscausas.cl (próximo paso)

### 6. Verificación del Deploy

Después del deploy, verificar:
- [ ] Login funciona con admin/admin123
- [ ] Dashboard carga estadísticas
- [ ] Navegación entre páginas
- [ ] Conexión con API de Railway

---

**Próximo Paso**: Una vez confirmado el funcionamiento en el dominio temporal, configuraremos el dominio personalizado erp.miscausas.cl.