# Dockerfile para frontend

FROM node:18-alpine

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache python3 make g++

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias primero para aprovechar caché de Docker
COPY package*.json ./

# Instalar todas las dependencias (incluyendo devDependencies para desarrollo)
RUN npm install --legacy-peer-deps && npm cache clean --force

# Copiar archivos de configuración
COPY webpack.config.js ./
COPY .babelrc ./

# Copiar el resto de archivos de la aplicación
COPY src ./src
COPY public ./public

# Exponer puerto (WebPack dev server)
EXPOSE 3000

# Configurar variables de entorno
ENV HOST=0.0.0.0
ENV NODE_ENV=development

# Nota: En producción, considerar usar un usuario no-root para mayor seguridad
# USER node

# Arrancar app en modo desarrollo
CMD ["npm", "run", "dev"]
