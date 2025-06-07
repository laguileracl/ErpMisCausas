# Guía de Despliegue - MisCausas.cl ERP

## 📋 Preparación del Entorno

### Requisitos del Sistema
- **Node.js**: 18.x o superior
- **PostgreSQL**: 14.x o superior  
- **Git**: Para control de versiones
- **npm**: Incluido con Node.js

### Variables de Entorno Requeridas
Crear archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Configurar las siguientes variables:
```env
# Base de datos PostgreSQL
DATABASE_URL=postgresql://usuario:password@host:puerto/nombre_bd

# Seguridad JWT
JWT_SECRET=clave_secreta_muy_segura_de_al_menos_32_caracteres

# Configuración del servidor
NODE_ENV=production
PORT=5000

# Email (opcional para notificaciones)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@empresa.com
SMTP_PASS=password_aplicacion
```

## 🚀 Despliegue Local

### 1. Instalación
```bash
# Clonar repositorio
git clone https://github.com/erpmiscausas/miscausas-erp.git
cd miscausas-erp

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores correctos
```

### 2. Configuración de Base de Datos
```bash
# Crear base de datos PostgreSQL
createdb miscausas_erp

# Aplicar esquema de base de datos
npm run db:push

# Cargar datos iniciales (opcional)
npm run seed
```

### 3. Ejecutar en Desarrollo
```bash
npm run dev
```
Aplicación disponible en: `http://localhost:5000`

### 4. Build de Producción
```bash
npm run build
npm start
```

## ☁️ Despliegue en la Nube

### Opción 1: Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configurar variables de entorno en Vercel dashboard
```

### Opción 2: Railway
```bash
# Conectar repositorio GitHub en Railway.app
# Configurar variables de entorno
# Deploy automático desde main branch
```

### Opción 3: Heroku
```bash
# Instalar Heroku CLI
npm install -g heroku

# Login y crear app
heroku login
heroku create miscausas-erp

# Configurar variables de entorno
heroku config:set DATABASE_URL=postgresql://...
heroku config:set JWT_SECRET=...
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

## 🐳 Despliegue con Docker

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Build aplicación
RUN npm run build

# Exponer puerto
EXPOSE 5000

# Comando de inicio
CMD ["npm", "start"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/miscausas_erp
      - JWT_SECRET=tu_jwt_secret
      - NODE_ENV=production
    depends_on:
      - db

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=miscausas_erp
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Comandos Docker
```bash
# Build y ejecutar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ejecutar migraciones
docker-compose exec app npm run db:push

# Parar servicios
docker-compose down
```

## 🔐 Configuración de Seguridad

### SSL/TLS
- Configurar certificados SSL para HTTPS
- Usar servicios como Cloudflare o Let's Encrypt

### Variables de Entorno de Producción
```env
NODE_ENV=production
JWT_SECRET=clave_muy_segura_de_64_caracteres_minimo
DATABASE_URL=postgresql://usuario:password@host:puerto/bd_produccion
```

### Firewall y Acceso
- Configurar firewall para permitir solo puertos necesarios
- Restringir acceso a base de datos desde IPs específicas
- Implementar rate limiting si es necesario

## 📊 Monitoreo

### Health Check Endpoint
La aplicación incluye endpoint de salud:
```
GET /health
```

### Logs
Los logs se escriben a stdout y pueden ser capturados por:
- Docker logs
- Heroku logs
- Servicios de logging como LogRocket, Sentry

### Métricas Recomendadas
- Tiempo de respuesta de API
- Uso de memoria y CPU
- Conexiones activas a base de datos
- Errores 4xx/5xx

## 🔄 CI/CD

### GitHub Actions
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - run: npm ci
      - run: npm run build
      - run: npm test
      
      # Deploy to your platform
      - name: Deploy to Production
        run: |
          # Comandos de deploy específicos
```

## 🚨 Troubleshooting

### Problemas Comunes

**Error de conexión a base de datos**
```bash
# Verificar que PostgreSQL esté ejecutándose
pg_isready -h localhost -p 5432

# Verificar credenciales en DATABASE_URL
```

**Error de permisos de archivos**
```bash
# Asegurar permisos correctos
chmod +x scripts/*
```

**Out of Memory**
```bash
# Aumentar límite de memoria Node.js
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### Logs de Debug
```bash
# Activar logs detallados
DEBUG=* npm start

# Solo logs de la aplicación
DEBUG=app:* npm start
```

## 📞 Soporte

Para problemas de despliegue:
1. Revisar logs de la aplicación
2. Verificar variables de entorno
3. Confirmar conectividad a base de datos
4. Contactar equipo de desarrollo si persisten problemas

---

**Última actualización**: Diciembre 2024