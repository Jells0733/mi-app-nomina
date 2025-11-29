#!/bin/bash

echo "🔨 Construyendo contenedor frontend..."

# Limpiar contenedores y imágenes anteriores
echo "🧹 Limpiando contenedores anteriores..."
docker-compose down
docker rmi mi-app_frontend 2>/dev/null || true

# Construir el contenedor frontend
echo "🏗️ Construyendo imagen frontend..."
docker-compose build frontend

# Ejecutar el contenedor
echo "🚀 Iniciando contenedor frontend..."
docker-compose up frontend 