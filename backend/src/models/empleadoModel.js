/**
 * @fileoverview Modelo de empleados
 * Maneja las operaciones de base de datos relacionadas con empleados del sistema
 */

const db = require('../config/db');

/**
 * Obtiene todos los empleados ordenados por ID
 * @returns {Array} Array con todos los empleados
 */
const getEmpleados = async () => {
  const res = await db.query(`
    SELECT 
      e.*,
      u.username,
      u.email
    FROM empleados e
    LEFT JOIN users u ON e.id_usuario = u.id
    ORDER BY e.id
  `);
  return res.rows;
};

/**
 * Crea un nuevo empleado en la base de datos
 * @param {Object} empleadoData - Datos del empleado a crear
 * @param {string} empleadoData.doc_type - Tipo de documento
 * @param {string} empleadoData.doc_number - Número de documento
 * @param {string} empleadoData.nombres - Nombres del empleado
 * @param {string} empleadoData.apellidos - Apellidos del empleado
 * @param {string} empleadoData.telefono - Teléfono (opcional)
 * @param {string} empleadoData.cargo - Cargo del empleado (opcional)
 * @param {string} empleadoData.fecha_ingreso - Fecha de ingreso (YYYY-MM-DD)
 * @param {number} empleadoData.base_salary - Sueldo básico mensual
 * @param {string} empleadoData.banco - Entidad bancaria (opcional)
 * @param {string} empleadoData.cuenta - Número de cuenta (opcional)
 * @param {string} empleadoData.status - Estado (Activo/Inactivo, default: Activo)
 * @param {number|null} empleadoData.id_usuario - ID del usuario asociado (opcional)
 * @returns {Object} Empleado creado con todos sus datos
 */
/**
 * Crea un nuevo empleado en la base de datos
 * @param {Object} empleadoData - Datos del empleado a crear
 * @param {Object} client - Cliente de base de datos (opcional, para transacciones)
 * @returns {Object} Empleado creado con todos sus datos
 */
const createEmpleado = async ({
  doc_type,
  doc_number,
  nombres,
  apellidos,
  telefono = null,
  cargo = null,
  fecha_ingreso,
  base_salary,
  banco = null,
  cuenta = null,
  status = 'Activo',
  id_usuario = null
}, client = null) => {
  // Usar el cliente proporcionado (para transacciones) o el pool por defecto
  const queryClient = client || db;
  
  const res = await queryClient.query(
    `INSERT INTO empleados (
      doc_type, doc_number, nombres, apellidos, telefono,
      cargo, fecha_ingreso, base_salary, banco, cuenta, status, id_usuario
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      doc_type, doc_number, nombres, apellidos, telefono,
      cargo, fecha_ingreso, base_salary, banco, cuenta, status, id_usuario
    ]
  );
  return res.rows[0];
};

/**
 * Obtiene el ID del empleado asociado a un usuario
 * @param {number} userId - ID del usuario
 * @returns {number|null} ID del empleado o null si no existe
 */
const getEmpleadoIdByUsuario = async (userId) => {
  const res = await db.query(
    'SELECT id FROM empleados WHERE id_usuario = $1',
    [userId]
  );
  return res.rows[0]?.id || null;
};

/**
 * Obtiene un empleado por su ID
 * @param {number} id - ID del empleado
 * @returns {Object|null} Empleado encontrado o null si no existe
 */
const getEmpleadoById = async (id) => {
  const res = await db.query(
    `SELECT 
      e.*,
      u.username,
      u.email
    FROM empleados e
    LEFT JOIN users u ON e.id_usuario = u.id
    WHERE e.id = $1`,
    [id]
  );
  return res.rows[0] || null;
};

/**
 * Obtiene todos los datos del empleado asociado a un usuario
 * @param {number} userId - ID del usuario
 * @returns {Object|null} Empleado encontrado o null si no existe
 */
const getEmpleadoByUserId = async (userId) => {
  const res = await db.query(
    `SELECT 
      e.*,
      u.username,
      u.email
    FROM empleados e
    LEFT JOIN users u ON e.id_usuario = u.id
    WHERE e.id_usuario = $1`,
    [userId]
  );
  return res.rows[0] || null;
};

/**
 * Actualiza los datos de un empleado existente
 * @param {number} id - ID del empleado a actualizar
 * @param {Object} empleadoData - Nuevos datos del empleado
 * @returns {Object} Empleado actualizado
 */
const updateEmpleadoById = async (id, empleadoData) => {
  // Construir dinámicamente la consulta UPDATE basada en los campos proporcionados
  const fields = [];
  const values = [];
  let paramIndex = 1;

  const allowedFields = [
    'doc_type', 'doc_number', 'nombres', 'apellidos', 'telefono',
    'cargo', 'fecha_ingreso', 'base_salary', 'banco', 'cuenta', 'status', 'id_usuario'
  ];

  for (const field of allowedFields) {
    if (empleadoData.hasOwnProperty(field)) {
      fields.push(`${field} = $${paramIndex}`);
      values.push(empleadoData[field]);
      paramIndex++;
    }
  }

  if (fields.length === 0) {
    throw new Error('No hay campos para actualizar');
  }

  values.push(id);
  const query = `
    UPDATE empleados
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const res = await db.query(query, values);
  return res.rows[0];
};

/**
 * Elimina un empleado de la base de datos (soft delete cambiando status a Inactivo)
 * @param {number} id - ID del empleado a desactivar
 * @returns {Object|null} Empleado actualizado o null si no existía
 */
const deleteEmpleadoById = async (id) => {
  // En lugar de eliminar, cambiamos el status a Inactivo
  const res = await db.query(
    `UPDATE empleados
     SET status = 'Inactivo'
     WHERE id = $1
     RETURNING *`,
    [id]
  );
  return res?.rows?.[0] || null;
};

/**
 * Obtiene empleados activos
 * @returns {Array} Array con empleados activos
 */
const getEmpleadosActivos = async () => {
  const res = await db.query(
    `SELECT 
      e.*,
      u.username,
      u.email
    FROM empleados e
    LEFT JOIN users u ON e.id_usuario = u.id
    WHERE e.status = 'Activo'
    ORDER BY e.id`
  );
  return res.rows;
};

module.exports = {
  getEmpleados,
  createEmpleado,
  getEmpleadoIdByUsuario,
  getEmpleadoById,
  getEmpleadoByUserId,
  updateEmpleadoById,
  deleteEmpleadoById,
  getEmpleadosActivos,
};
