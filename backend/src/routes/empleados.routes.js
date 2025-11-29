/**
 * @fileoverview Rutas de empleados
 * Define los endpoints para la gestión de empleados del sistema
 */

const express = require('express');
const router = express.Router();

const {
  getEmpleados,
  createEmpleado,
  updateEmpleado,
  deleteEmpleado,
  getEmpleado
} = require('../controllers/empleados.controller');

const {
  authenticateToken,
  authorizeRole
} = require('../middlewares/auth.middleware');

const {
  validateCreateEmpleado,
  validateUpdateEmpleado,
  validateSearchEmpleados
} = require('../middlewares/validation.middleware');

const {
  getEmpleadoIdByUsuario
} = require('../models/empleadoModel');

/**
 * GET /api/empleados
 * Obtiene la lista de empleados con paginación y filtro por nombre
 * Query params: page, limit, nombre, doc_number
 * Requiere autenticación
 */
router.get('/', authenticateToken, validateSearchEmpleados, getEmpleados);

/**
 * GET /api/empleados/mi-id
 * Obtiene el ID del empleado asociado al usuario autenticado
 * Utilizado para depuración y verificación de asociación usuario-empleado
 * Requiere autenticación
 */
router.get('/mi-id', authenticateToken, async (req, res) => {
  console.log('[GET /mi-id] req.user:', req.user);

  try {
    // Verificar que el token contenga userId
    if (!req.user || !req.user.userId) {
      console.warn('Token válido pero sin userId en payload.');
      return res.status(400).json({ error: 'Token inválido: falta userId' });
    }

    // Buscar el ID del empleado asociado al usuario
    const id = await getEmpleadoIdByUsuario(req.user.userId);
    console.log(`ID de empleado encontrado para userId ${req.user.userId}: ${id}`);

    // Verificar que se encontró un empleado
    if (!id) {
      console.warn(`No se encontró un empleado con id_usuario = ${req.user.userId}`);
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    res.json({ id });
  } catch (error) {
    console.error('Error al obtener ID de empleado:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

/**
 * POST /api/empleados
 * Crea un nuevo empleado en el sistema
 * Body: { doc_type, doc_number, nombres, apellidos, telefono, cargo, fecha_ingreso, base_salary, banco, cuenta, status, id_usuario }
 * Requiere autenticación y rol de administrador
 */
router.post('/', authenticateToken, authorizeRole(['admin']), validateCreateEmpleado, createEmpleado);

/**
 * GET /api/empleados/:id
 * Obtiene un empleado específico por su ID
 * Requiere autenticación
 */
router.get('/:id', authenticateToken, getEmpleado);

/**
 * PUT /api/empleados/:id
 * Actualiza los datos de un empleado existente
 * Body: { doc_type, doc_number, nombres, apellidos, telefono, cargo, fecha_ingreso, base_salary, banco, cuenta, status, id_usuario }
 * Requiere autenticación y rol de administrador
 */
router.put('/:id', authenticateToken, authorizeRole(['admin']), validateUpdateEmpleado, updateEmpleado);

/**
 * DELETE /api/empleados/:id
 * Desactiva un empleado (soft delete - cambia status a Inactivo)
 * Requiere autenticación y rol de administrador
 */
router.delete('/:id', authenticateToken, authorizeRole(['admin']), deleteEmpleado);

module.exports = router;
