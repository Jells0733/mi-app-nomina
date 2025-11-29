/**
 * @fileoverview Punto de entrada principal del servidor
 * Este archivo inicia el servidor Express y valida las variables de entorno requeridas
 */

// Importar la aplicación Express configurada
const app = require('./app');

// Definir el puerto del servidor (por defecto 4000)
const PORT = process.env.PORT || 4000;

/**
 * Validación de variables de entorno críticas
 * Verifica que JWT_SECRET esté configurado antes de iniciar el servidor
 */
if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET en las variables de entorno');
  process.exit(1);
}

// Mostrar información del modo de ejecución
console.log(`Servidor en modo ${process.env.NODE_ENV || 'development'}`);

/**
 * Iniciar el servidor HTTP
 * El servidor escuchará en el puerto especificado y mostrará un mensaje de confirmación
 */
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
