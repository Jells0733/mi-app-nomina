/**
 * @fileoverview Configuración de conexión a la base de datos PostgreSQL
 * Este archivo establece la conexión con la base de datos usando el pool de conexiones
 */

const { Pool } = require('pg');
require('dotenv').config();

/**
 * Crear pool de conexiones a PostgreSQL
 * El pool permite reutilizar conexiones para mejorar el rendimiento
 * Las credenciales se obtienen de las variables de entorno
 */
const pool = new Pool({
  host: process.env.DB_HOST,           // Host de la base de datos
  user: process.env.DB_USER,           // Usuario de la base de datos
  password: process.env.DB_PASSWORD,   // Contraseña del usuario
  database: process.env.DB_NAME,       // Nombre de la base de datos
  port: process.env.DB_PORT,           // Puerto de la base de datos
  // ssl: { rejectUnauthorized: false }, // Configuración SSL para despliegues en la nube
});

module.exports = pool;
