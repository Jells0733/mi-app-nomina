# Dockerfile para backend

FROM node:22-alpine

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache python3 make g++

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero para aprovechar caché de Docker
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para desarrollo)
RUN npm ci && npm cache clean --force

# Copiar el resto de archivos de la aplicación
COPY . .

# Exponer puerto del servidor
EXPOSE 4000

# Nota: En producción, considerar usar un usuario no-root para mayor seguridad
# USER node

# Comando para iniciar la aplicación
CMD ["npm", "start"]
