# Frontend - Mi App

## 🚀 Ejecución con Docker

### Opción 1: Usando docker-compose (Recomendado)
```bash
# Construir y ejecutar solo el frontend
docker-compose build frontend
docker-compose up frontend

# O ejecutar toda la aplicación
docker-compose up
```

### Opción 2: Usando scripts
```bash
# En Linux/Mac
chmod +x ../build-frontend.sh
../build-frontend.sh

# En Windows (PowerShell)
../build-frontend.ps1
```

### Opción 3: Docker directo
```bash
# Construir imagen
docker build -t mi-app-frontend .

# Ejecutar contenedor
docker run -p 3000:3000 -v $(pwd):/app mi-app-frontend
```

## 🔧 Desarrollo Local

### Prerrequisitos
- Node.js 18 o superior
- npm

### Instalación
```bash
npm install
```

### Ejecución
```bash
npm run dev
```

## 🐛 Solución de Problemas

### Error: "webpack: not found"
Este error ocurre cuando las dependencias no se instalan correctamente en el contenedor.

**Solución:**
1. Limpiar contenedores e imágenes:
   ```bash
   docker-compose down
   docker rmi mi-app_frontend
   ```

2. Reconstruir sin cache:
   ```bash
   docker-compose build --no-cache frontend
   ```

3. Ejecutar:
   ```bash
   docker-compose up frontend
   ```

### Error de permisos en Windows
Si tienes problemas de permisos en Windows, ejecuta PowerShell como administrador.

### Puerto 3000 ocupado
Si el puerto 3000 está ocupado, puedes cambiar el puerto en `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Cambia 3001 por el puerto que prefieras
```

## 📁 Estructura del Proyecto
```
frontend/
├── src/           # Código fuente React
├── public/        # Archivos públicos
├── webpack.config.js  # Configuración de Webpack
├── .babelrc       # Configuración de Babel
├── package.json   # Dependencias
└── Dockerfile     # Configuración de Docker
```

## 🔗 URLs
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Base de datos: localhost:5432
- PgAdmin: http://localhost:5050 