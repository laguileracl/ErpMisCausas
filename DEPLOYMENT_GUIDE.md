# Guía de Deployment - ERP MisCausas

## 🚀 RAILWAY DEPLOYMENT - PASO A PASO COMPLETO

### Requisitos Previos
- Cuenta en Railway.app
- Repositorio GitHub: https://github.com/laguileracl/ErpMisCausas
- Acceso de administrador al repositorio

### Paso 1: Configurar Railway

1. **Crear cuenta en Railway**:
   - Visita https://railway.app
   - Regístrate con tu cuenta GitHub
   - Autoriza acceso a tus repositorios

2. **Crear nuevo proyecto**:
   - Clic en "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Busca y selecciona: `laguileracl/ErpMisCausas`
   - Railway detectará automáticamente que es una aplicación Node.js

### Paso 2: Configurar Base de Datos

1. **Agregar PostgreSQL**:
   - En el dashboard del proyecto, clic en "Add Service"
   - Selecciona "Database" → "PostgreSQL"
   - Railway creará automáticamente la base de datos

2. **Obtener DATABASE_URL**:
   - Clic en el servicio PostgreSQL
   - Ve a la pestaña "Variables"
   - Copia el valor de `DATABASE_URL`

### Paso 3: Configurar Variables de Entorno

1. **Acceder a variables del servicio web**:
   - Clic en el servicio de la aplicación (no la base de datos)
   - Ve a la pestaña "Variables"

2. **Agregar variables requeridas**:
   ```
   NODE_ENV=production
   DATABASE_URL=[pegar URL de PostgreSQL]
   JWT_SECRET=tu-secreto-jwt-minimo-32-caracteres
   SESSION_SECRET=tu-secreto-session-minimo-32-caracteres
   ```

3. **Generar secretos seguros** (usar generador online o comando):
   ```bash
   # Ejemplo de secretos seguros:
   JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
   SESSION_SECRET=z6y5x4w3v2u1t0s9r8q7p6o5n4m3l2k1j0i9h8g7f6e5d4c3b2a1
   ```

### Paso 4: Configurar Deployment Automático

1. **Conectar GitHub Actions**:
   - En Railway, ve a "Settings" → "Environment"
   - Activa "Auto-Deploy" desde branch `main`
   - Configura "Build Command": `npm run build`
   - Configura "Start Command": `npm start`

2. **Configurar secretos en GitHub**:
   - Ve a tu repositorio GitHub
   - Settings → Secrets and variables → Actions
   - Agregar secretos:
     ```
     RAILWAY_TOKEN=[obtener desde Railway Profile → Tokens]
     RAILWAY_SERVICE_ID=[obtener desde Railway Service Settings]
     ```

### Paso 5: Primer Deployment

1. **Triggear deployment**:
   - Railway iniciará automáticamente el primer deploy
   - Puedes ver el progreso en "Deployments"

2. **Verificar build**:
   - Tiempo estimado: 3-5 minutos
   - Verificar que no hay errores en los logs
   - Estado debe cambiar a "Success"

### Paso 6: Configurar Dominio

1. **Generar dominio Railway**:
   - En el servicio, ve a "Settings" → "Domains"
   - Clic en "Generate Domain"
   - Railway asignará: `https://erp-miscausas-production.up.railway.app`

2. **Probar aplicación**:
   - Visita el dominio generado
   - Verificar que carga la página de login

### Paso 7: Inicializar Base de Datos

1. **Ejecutar migraciones**:
   - En Railway, ve a "Deployments" → "View Logs"
   - Verificar que las tablas se crearon automáticamente
   - Si hay errores, revisar variables de entorno

2. **Verificar salud del sistema**:
   - Visita: `https://tu-dominio.up.railway.app/api/health`
   - Debe retornar: `{"status": "ok", "database": "connected"}`

### Paso 8: Validación Completa

1. **Probar funcionalidades principales**:
   - Crear cuenta de usuario
   - Acceder al módulo contable
   - Crear una cuenta en el plan de cuentas
   - Generar un voucher de prueba
   - Crear una causa legal
   - Generar cuenta provisoria PDF
   - Descargar ZIP de cuentas múltiples

2. **Verificar performance**:
   - Tiempo de carga de páginas < 3 segundos
   - Generación de PDF < 30 segundos
   - Descarga de ZIP < 2 minutos

### Paso 9: Configurar Dominio Personalizado (erp.miscausas.cl)

1. **En Railway**:
   - Ve a "Settings" → "Domains"
   - Clic en "Custom Domain"
   - Ingresa: `erp.miscausas.cl`
   - Railway proporcionará los registros DNS

2. **En tu proveedor DNS**:
   - Agregar registro CNAME:
     ```
     erp.miscausas.cl → [dominio proporcionado por Railway]
     ```
   - Tiempo de propagación: 5-60 minutos

3. **Verificar SSL**:
   - Railway generará automáticamente certificado SSL
   - Verificar que https://erp.miscausas.cl funcione

### Troubleshooting Común

**Error: Build failed**
- Revisar que todas las variables de entorno estén configuradas
- Verificar que DATABASE_URL sea válida

**Error: Database connection**
- Confirmar que PostgreSQL service esté activo
- Verificar DATABASE_URL en variables de entorno

**Error: PDF generation**
- Los PDFs requieren Chromium, incluido en el Dockerfile
- Verificar logs para errores específicos de Puppeteer

## Preparación para Producción

### 1. Build de Producción

El proyecto está configurado para generar builds optimizados. Para crear el build de producción:

```bash
# Instalar dependencias
npm install

# Generar build de producción
npm run build

# El build se genera en la carpeta dist/
```

### 2. Variables de Entorno Requeridas

Crear archivo `.env` en el servidor de producción:

```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://usuario:password@host:5432/database_name
PGHOST=your-postgres-host
PGPORT=5432
PGDATABASE=erp_miscausas
PGUSER=your-db-user
PGPASSWORD=your-db-password

# Configuración del servidor
NODE_ENV=production
PORT=5000

# Seguridad (generar valores únicos)
JWT_SECRET=your-super-secure-jwt-secret-key-here
SESSION_SECRET=your-super-secure-session-secret-here

# Email (opcional para notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Scripts de Producción

El `package.json` incluye scripts optimizados:

```json
{
  "scripts": {
    "build": "vite build",
    "start": "NODE_ENV=production tsx server/index.ts",
    "db:push": "drizzle-kit push",
    "db:migrate": "drizzle-kit migrate"
  }
}
```

## Opciones de Deployment

### Opción 1: Railway (Recomendado)

Railway es ideal para aplicaciones Node.js con PostgreSQL.

#### Pasos de Deployment:

1. **Conectar GitHub Repository**:
   ```bash
   # En Railway Dashboard:
   # 1. Crear nuevo proyecto
   # 2. Conectar GitHub repo: https://github.com/laguileracl/ErpMisCausas
   # 3. Railway detectará automáticamente la configuración
   ```

2. **Configurar Base de Datos**:
   ```bash
   # Railway PostgreSQL plugin
   # 1. Agregar PostgreSQL plugin al proyecto
   # 2. Railway generará automáticamente DATABASE_URL
   ```

3. **Variables de Entorno en Railway**:
   ```
   NODE_ENV=production
   JWT_SECRET=generate-secure-random-key
   SESSION_SECRET=generate-secure-random-key
   ```

4. **Deploy Automático**:
   - Railway desplegará automáticamente en cada push a main
   - URL de producción: https://your-app-name.railway.app

#### Configuración de Railway (`railway.json`):
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health"
  }
}
```

### Opción 2: Render

Render ofrece deployment gratuito con PostgreSQL.

#### Pasos de Deployment:

1. **Crear Web Service**:
   - Repository: https://github.com/laguileracl/ErpMisCausas
   - Branch: main
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

2. **Configurar PostgreSQL**:
   - Crear PostgreSQL database en Render
   - Copiar DATABASE_URL a variables de entorno

3. **Variables de Entorno**:
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-jwt-secret
   SESSION_SECRET=your-session-secret
   ```

### Opción 3: Fly.io

Fly.io ofrece excelente performance global.

#### Configuración (`fly.toml`):
```toml
app = "erp-miscausas"
primary_region = "scl"

[build]
  builder = "heroku/buildpacks:20"

[env]
  NODE_ENV = "production"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true

[[services]]
  protocol = "tcp"
  internal_port = 8080

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

[postgres]
  app = "erp-miscausas-db"
```

#### Comandos de Deployment:
```bash
# Instalar Fly CLI
curl -L https://fly.io/install.sh | sh

# Login y configuración
fly auth login
fly launch --copy-config

# Deploy
fly deploy
```

### Opción 4: VPS Propio (Linux)

Para mayor control, usar VPS con Docker.

#### Dockerfile:
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias del sistema para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Variables de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copiar archivos de configuración
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Build de producción
RUN npm run build

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 5000

CMD ["npm", "start"]
```

#### Docker Compose para VPS:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/erp_miscausas
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: erp_miscausas
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your-secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

## GitHub Actions para CI/CD

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: erp_miscausas_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Setup test database
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/erp_miscausas_test
      run: npm run db:push
    
    - name: Run tests
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/erp_miscausas_test
        NODE_ENV: test
      run: npm test

  deploy-railway:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to Railway
      uses: railway-deploy/action@v1
      with:
        token: ${{ secrets.RAILWAY_TOKEN }}
        service: ${{ secrets.RAILWAY_SERVICE_ID }}

  deploy-render:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - name: Deploy to Render
      uses: johnbeynon/render-deploy-action@v0.0.8
      with:
        service-id: ${{ secrets.RENDER_SERVICE_ID }}
        api-key: ${{ secrets.RENDER_API_KEY }}
```

## Configuración de Secretos en GitHub

En GitHub Repository → Settings → Secrets, agregar:

```
RAILWAY_TOKEN=your-railway-token
RAILWAY_SERVICE_ID=your-service-id
RENDER_API_KEY=your-render-api-key
RENDER_SERVICE_ID=your-render-service-id
```

## Scripts de Administración

Crear `scripts/deploy.sh`:

```bash
#!/bin/bash

echo "🚀 Iniciando deployment de ERP MisCausas..."

# Verificar que estamos en la rama main
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "❌ Error: Deploy solo desde rama main"
  exit 1
fi

# Verificar que no hay cambios sin commit
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Error: Hay cambios sin commit"
  exit 1
fi

# Build y tests
echo "📦 Ejecutando build..."
npm run build

echo "🧪 Ejecutando tests..."
npm test

# Push a GitHub (triggerea GitHub Actions)
echo "📤 Pushing a GitHub..."
git push origin main

echo "✅ Deployment iniciado. Revisar GitHub Actions para el progreso."
```

## Monitoreo y Logs

### Health Check Endpoint

El servidor incluye endpoint de salud:

```typescript
// En server/index.ts
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV
  });
});
```

### Configuración de Logs

Para producción, configurar logs estructurados:

```bash
# Railway logs
railway logs

# Render logs  
render logs

# Docker logs
docker logs container-name --tail 100 -f
```

## Respaldos de Base de Datos

### Script de Backup Automático:

```bash
#!/bin/bash
# scripts/backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="erp_miscausas"

# Crear directorio si no existe
mkdir -p $BACKUP_DIR

# Backup completo
pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# Mantener solo últimos 30 backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

echo "Backup completado: backup_$DATE.sql"
```

### Configurar Cron para Backups:

```bash
# Ejecutar backup diario a las 2 AM
0 2 * * * /path/to/scripts/backup.sh
```

## SSL/TLS y Seguridad

### Nginx Configuration para VPS:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://app:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Recomendación Final

**Para deployment inicial, recomiendo Railway** por:

1. **Simplicidad**: Deployment automático desde GitHub
2. **PostgreSQL incluido**: No requiere configuración adicional
3. **Escalabilidad**: Fácil escalar según demanda
4. **Precio**: Plan gratuito generoso, pricing transparente
5. **Soporte**: Excelente documentación y soporte

### Pasos Inmediatos:

1. Crear cuenta en Railway
2. Conectar repositorio GitHub
3. Agregar PostgreSQL plugin
4. Configurar variables de entorno
5. Deploy automático

El sistema estará listo para producción en menos de 30 minutos.

---

**Próximos pasos después del deployment:**
- Configurar dominio personalizado
- Implementar monitoreo con Sentry
- Configurar backups automáticos
- Optimizar performance con CDN