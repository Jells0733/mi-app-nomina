# Guía de Configuración Docker

Esta guía explica cómo configurar y ejecutar la aplicación usando Docker y Docker Compose.

## Requisitos Previos

- Docker Desktop instalado (o Docker Engine + Docker Compose)
- Al menos 4GB de RAM disponibles
- Puertos libres: 3000, 4000, 5432, 5050

## Estructura de Servicios

La aplicación está compuesta por los siguientes servicios:

1. **backend**: API REST en Node.js (puerto 4000)
2. **frontend**: Aplicación React (puerto 3000)
3. **db**: Base de datos PostgreSQL 15 (puerto 5432)
4. **pgadmin**: Interfaz web para administrar PostgreSQL (puerto 5050)

## Variables de Entorno

### Backend

El backend requiere las siguientes variables de entorno (ya configuradas en `docker-compose.yml`):

- `NODE_ENV`: Entorno de ejecución (development/production)
- `PORT`: Puerto del servidor (por defecto: 4000)
- `DB_HOST`: Host de la base de datos (usar `db` en Docker)
- `DB_USER`: Usuario de PostgreSQL (por defecto: postgres)
- `DB_PASSWORD`: Contraseña de PostgreSQL
- `DB_NAME`: Nombre de la base de datos (por defecto: miapp)
- `DB_PORT`: Puerto de PostgreSQL (por defecto: 5432)
- `JWT_SECRET`: Secreto para firmar tokens JWT (IMPORTANTE: cambiar en producción)

### Personalizar Variables de Entorno

Puedes crear un archivo `.env` en la raíz del proyecto para personalizar las variables:

```env
JWT_SECRET=tu-secreto-jwt-personalizado
DB_PASSWORD=tu-contraseña-segura
```

## Comandos Principales

### Iniciar todos los servicios

```bash
docker-compose up
```

### Iniciar en segundo plano (detached)

```bash
docker-compose up -d
```

### Reconstruir las imágenes

Si has modificado los Dockerfiles o dependencias:

```bash
docker-compose build
```

O forzar reconstrucción sin caché:

```bash
docker-compose build --no-cache
```

### Ver logs de los servicios

```bash
# Todos los servicios
docker-compose logs

# Servicio específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs db
```

### Detener los servicios

```bash
docker-compose down
```

### Detener y eliminar volúmenes (incluyendo datos de BD)

```bash
docker-compose down -v
```

## Instalación de Dependencias

Las dependencias se instalan automáticamente al construir las imágenes Docker. Sin embargo, si necesitas instalar nuevas dependencias:

### Backend

1. Agrega la dependencia al `package.json` del backend
2. Reconstruye la imagen: `docker-compose build backend`
3. Reinicia el servicio: `docker-compose restart backend`

O instala directamente en el contenedor (para desarrollo):

```bash
docker-compose exec backend npm install nombre-paquete
```

### Frontend

1. Agrega la dependencia al `package.json` del frontend
2. Reconstruye la imagen: `docker-compose build frontend`
3. Reinicia el servicio: `docker-compose restart frontend`

O instala directamente en el contenedor (para desarrollo):

```bash
docker-compose exec frontend npm install nombre-paquete
```

## Acceso a los Servicios

Una vez iniciados los servicios, puedes acceder a:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **pgAdmin**: http://localhost:5050
  - Email: jorge.llamas@local.dev
  - Contraseña: Ntc0394**

## Solución de Problemas

### Los servicios no inician

1. Verifica que los puertos no estén en uso:
   ```bash
   # Windows PowerShell
   netstat -ano | findstr :3000
   netstat -ano | findstr :4000
   netstat -ano | findstr :5432
   ```

2. Verifica los logs:
   ```bash
   docker-compose logs
   ```

### Error de conexión a la base de datos

1. Verifica que el servicio `db` esté corriendo:
   ```bash
   docker-compose ps
   ```

2. Verifica las variables de entorno del backend:
   ```bash
   docker-compose exec backend env | grep DB_
   ```

### Las dependencias no se instalan correctamente

1. Limpia el caché de Docker:
   ```bash
   docker system prune -a
   ```

2. Reconstruye sin caché:
   ```bash
   docker-compose build --no-cache
   ```

### Problemas con node_modules en volúmenes

Los `node_modules` se preservan en volúmenes anónimos para evitar conflictos entre el host y el contenedor. Si tienes problemas:

1. Elimina los volúmenes:
   ```bash
   docker-compose down -v
   ```

2. Reconstruye y reinicia:
   ```bash
   docker-compose build
   docker-compose up
   ```

## Desarrollo

### Modo Desarrollo con Hot Reload

Los servicios están configurados para desarrollo con hot reload:
- **Backend**: Usa `nodemon` para reiniciar automáticamente
- **Frontend**: Usa `webpack-dev-server` con hot reload

Los cambios en el código se reflejan automáticamente sin necesidad de reconstruir las imágenes.

### Ejecutar comandos dentro de los contenedores

```bash
# Backend
docker-compose exec backend npm run dev
docker-compose exec backend node script.js

# Frontend
docker-compose exec frontend npm run build
docker-compose exec frontend npm test
```

## Producción

Para producción, considera:

1. Usar imágenes optimizadas (multi-stage builds)
2. Configurar usuarios no-root en los Dockerfiles
3. Usar variables de entorno seguras (no hardcodeadas)
4. Configurar SSL/TLS
5. Usar un reverse proxy (nginx)
6. Configurar backups de la base de datos

## Notas Adicionales

- Los datos de PostgreSQL se persisten en el volumen `pgdata`
- El script de inicialización `backend/sql/init.sql` se ejecuta automáticamente al crear la base de datos por primera vez
- Los `node_modules` se montan como volúmenes anónimos para evitar conflictos con el sistema de archivos del host

