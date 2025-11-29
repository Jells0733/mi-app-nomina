/**
 * @fileoverview Modelo de usuarios
 * Maneja las operaciones de base de datos relacionadas con usuarios del sistema
 */

const db = require('../config/db');

/**
 * Crea un nuevo usuario en la base de datos
 * @param {Object} userData - Datos del usuario a crear
 * @param {string} userData.username - Nombre de usuario
 * @param {string} userData.nombre - Nombre completo de la persona (opcional)
 * @param {string} userData.email - Email del usuario
 * @param {string} userData.password - Contraseña encriptada
 * @param {string} userData.role - Rol del usuario (admin/empleado)
 * @param {Object} client - Cliente de base de datos (opcional, para transacciones)
 * @returns {Object} Usuario creado con todos sus datos
 */
const createUser = async ({ username, nombre = null, email, password, role }, client = null) => {
  // Usar el cliente proporcionado (para transacciones) o el pool por defecto
  const queryClient = client || db;
  
  const res = await queryClient.query(
    `INSERT INTO users (username, nombre, email, password, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [username, nombre, email, password, role]
  );
  return res.rows[0];
};

/**
 * Busca un usuario por su email
 * @param {string} email - Email del usuario a buscar
 * @returns {Object|null} Usuario encontrado o null si no existe
 */
const getUserByEmail = async (email) => {
  const res = await db.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return res.rows[0];
};

module.exports = {
  createUser,
  getUserByEmail,
};
