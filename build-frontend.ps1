Write-Host "🔨 Construyendo contenedor frontend..." -ForegroundColor Green

# Limpiar contenedores y imágenes anteriores
Write-Host "🧹 Limpiando contenedores anteriores..." -ForegroundColor Yellow
docker-compose down
docker rmi mi-app_frontend 2>$null

# Construir el contenedor frontend
Write-Host "🏗️ Construyendo imagen frontend..." -ForegroundColor Yellow
docker-compose build frontend

# Ejecutar el contenedor
Write-Host "🚀 Iniciando contenedor frontend..." -ForegroundColor Green
docker-compose up frontend 