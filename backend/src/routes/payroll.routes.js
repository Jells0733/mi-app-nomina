/**
 * @fileoverview Rutas de nómina
 * Define los endpoints para la gestión de registros de pago (nómina)
 */

const express = require('express');
const router = express.Router();

const {
  getPayrolls,
  getPayroll,
  generatePayroll,
  generatePayrollForAll,
  deletePayroll
} = require('../controllers/payroll.controller');

const {
  authenticateToken,
  authorizeRole
} = require('../middlewares/auth.middleware');

const {
  validateGeneratePayroll,
  validateGeneratePayrollForAll,
  validateSearchPayroll,
  validateDeletePayroll
} = require('../middlewares/validation.middleware');

/**
 * GET /api/payroll
 * Obtiene la lista de registros de nómina con paginación
 * Query params: page, limit, nombre, doc_number (opcional)
 * Requiere autenticación
 */
router.get('/', authenticateToken, validateSearchPayroll, getPayrolls);

/**
 * GET /api/payroll/:id
 * Obtiene un registro de nómina específico por su ID
 * Requiere autenticación
 */
router.get('/:id', authenticateToken, getPayroll);

/**
 * POST /api/payroll
 * Genera un nuevo registro de nómina para un empleado
 * Body: { id_empleado, periodo_pago, aplicar_auxilio_transporte (opcional), observaciones (opcional) }
 * Requiere autenticación y rol de administrador
 */
router.post('/', authenticateToken, authorizeRole(['admin']), validateGeneratePayroll, generatePayroll);

/**
 * POST /api/payroll/generate-all
 * Genera nómina para todos los empleados activos
 * Body: { periodo_pago, aplicar_auxilio_transporte (opcional), observaciones (opcional) }
 * Requiere autenticación y rol de administrador
 */
router.post('/generate-all', authenticateToken, authorizeRole(['admin']), validateGeneratePayrollForAll, generatePayrollForAll);

/**
 * DELETE /api/payroll/:id
 * Elimina un registro de nómina
 * Requiere autenticación y rol de administrador
 */
router.delete('/:id', authenticateToken, authorizeRole(['admin']), validateDeletePayroll, deletePayroll);

module.exports = router;

