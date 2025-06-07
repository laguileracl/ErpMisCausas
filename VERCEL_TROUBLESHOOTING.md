# Vercel Deployment - Troubleshooting Guide

## Errores Comunes y Soluciones

### 1. Error de Build Command

**Problema**: Script `build.sh` no ejecuta correctamente
**Solución**: Usar comando directo en `vercel.json`:

```json
{
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/dist"
}
```

### 2. Error de Estructura de Directorios

**Problema**: Vercel no encuentra los archivos build
**Configuración correcta**:
- Root del proyecto: `/`
- Frontend code: `/client/`
- Build output: `/client/dist/`

### 3. Variables de Entorno

**Verificar que esté configurado**:
```json
"env": {
  "VITE_API_URL": "https://erp-miscausas-production.up.railway.app"
}
```

### 4. Pasos para Re-deploy

Si el deployment falla:

1. **En Vercel Dashboard**:
   - Ve a Project Settings
   - Build & Development Settings
   - Verifica:
     - Build Command: `cd client && npm install && npm run build`
     - Output Directory: `client/dist`
     - Install Command: `npm install`

2. **Variables de Entorno**:
   - Agrega `VITE_API_URL` en Environment Variables
   - Value: `https://erp-miscausas-production.up.railway.app`

3. **Trigger Re-deploy**:
   - Ve a Deployments tab
   - Click en "Redeploy" en el último deployment

### 5. Testing Local

Para verificar que el build funciona:

```bash
cd client
npm install
npm run build
# Verificar que se crea client/dist/ con archivos
```

### 6. URL del Deployment

Una vez exitoso, Vercel asignará una URL como:
- `https://erp-miscausas.vercel.app`
- `https://erp-misc-causas-[hash].vercel.app`

### 7. Verificación Post-Deploy

- [ ] Página carga correctamente
- [ ] Login funciona (admin/admin123)
- [ ] Dashboard muestra datos
- [ ] Conexión API a Railway funciona

---

**Si persisten errores**, compartir los logs específicos de Vercel para diagnóstico detallado.