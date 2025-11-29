/**
 * @fileoverview Modelo de nómina
 * Maneja las operaciones de base de datos relacionadas con registros de pago (nómina)
 */

const db = require('../config/db');

/**
 * Obtiene todos los registros de nómina ordenados por fecha de generación
 * @returns {Array} Array con todos los registros de nómina
 */
const getPayrollRecords = async () => {
  const res = await db.query(`
    SELECT 
      pr.*,
      e.nombres || ' ' || e.apellidos AS empleado_nombre,
      e.doc_number AS empleado_doc,
      e.cargo AS empleado_cargo
    FROM payroll_records pr
    LEFT JOIN empleados e ON pr.id_empleado = e.id
    ORDER BY pr.fecha_generacion DESC, pr.periodo_pago DESC
  `);
  return res.rows;
};

/**
 * Obtiene los registros de nómina de un empleado específico
 * @param {number} empleadoId - ID del empleado
 * @returns {Array} Array con los registros de nómina del empleado
 */
const getPayrollRecordsByEmpleado = async (empleadoId) => {
  const res = await db.query(`
    SELECT 
      pr.*,
      e.nombres || ' ' || e.apellidos AS empleado_nombre,
      e.doc_number AS empleado_doc,
      e.cargo AS empleado_cargo
    FROM payroll_records pr
    LEFT JOIN empleados e ON pr.id_empleado = e.id
    WHERE pr.id_empleado = $1
    ORDER BY pr.fecha_generacion DESC, pr.periodo_pago DESC
  `, [empleadoId]);
  return res.rows;
};

/**
 * Obtiene un registro de nómina por su ID
 * @param {number} id - ID del registro de nómina
 * @returns {Object|null} Registro de nómina encontrado o null si no existe
 */
const getPayrollRecordById = async (id) => {
  const res = await db.query(`
    SELECT 
      pr.*,
      e.nombres || ' ' || e.apellidos AS empleado_nombre,
      e.doc_number AS empleado_doc,
      e.cargo AS empleado_cargo,
      e.base_salary,
      e.banco,
      e.cuenta
    FROM payroll_records pr
    LEFT JOIN empleados e ON pr.id_empleado = e.id
    WHERE pr.id = $1
  `, [id]);
  return res.rows[0] || null;
};

/**
 * Crea un nuevo registro de nómina en la base de datos
 * @param {Object} payrollData - Datos del registro de nómina
 * @param {number} payrollData.id_empleado - ID del empleado
 * @param {string} payrollData.periodo_pago - Fecha del período de pago (YYYY-MM-DD)
 * @param {Array} payrollData.details - Array de conceptos de la colilla
 * @param {number} payrollData.total_accrued - Total devengado
 * @param {number} payrollData.total_deducted - Total deducido
 * @param {number} payrollData.net_pay - Neto a pagar
 * @param {string} payrollData.observaciones - Observaciones (opcional)
 * @returns {Object} Registro de nómina creado
 */
const createPayrollRecord = async ({
  id_empleado,
  periodo_pago,
  details,
  total_accrued,
  total_deducted,
  net_pay,
  observaciones = null
}) => {
  const res = await db.query(
    `INSERT INTO payroll_records (
      id_empleado, periodo_pago, details,
      total_accrued, total_deducted, net_pay, observaciones
    )
    VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7)
    RETURNING *`,
    [
      id_empleado,
      periodo_pago,
      JSON.stringify(details),
      total_accrued,
      total_deducted,
      net_pay,
      observaciones
    ]
  );
  return res.rows[0];
};

/**
 * Obtiene el último registro de nómina de un empleado para un período específico
 * @param {number} empleadoId - ID del empleado
 * @param {string} periodo - Fecha del período (YYYY-MM-DD)
 * @returns {Object|null} Registro de nómina encontrado o null
 */
const getPayrollRecordByEmpleadoAndPeriodo = async (empleadoId, periodo) => {
  const res = await db.query(
    `SELECT * FROM payroll_records 
     WHERE id_empleado = $1 AND periodo_pago = $2
     ORDER BY fecha_generacion DESC
     LIMIT 1`,
    [empleadoId, periodo]
  );
  return res.rows[0] || null;
};

/**
 * Elimina un registro de nómina
 * @param {number} id - ID del registro a eliminar
 * @returns {boolean} true si se eliminó correctamente
 */
const deletePayrollRecord = async (id) => {
  const res = await db.query(
    'DELETE FROM payroll_records WHERE id = $1 RETURNING id',
    [id]
  );
  return res.rows.length > 0;
};

module.exports = {
  getPayrollRecords,
  getPayrollRecordsByEmpleado,
  getPayrollRecordById,
  createPayrollRecord,
  getPayrollRecordByEmpleadoAndPeriodo,
  deletePayrollRecord,
};

