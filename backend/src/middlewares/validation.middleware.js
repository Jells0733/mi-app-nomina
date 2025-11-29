/**
 * @fileoverview Middlewares de validación y sanitización
 * Usa express-validator para validar y sanitizar inputs
 */

const { body, validationResult, query, param } = require('express-validator');
const { sanitizeString, sanitizeEmail, sanitizeDocument, sanitizePhone, sanitizeText, sanitizeNumber } = require('../utils/sanitize');

/**
 * Middleware para manejar errores de validación
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Error de validación',
      details: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

/**
 * Validaciones para registro de usuario
 */
const validateRegister = [
  body('username')
    .trim()
    .notEmpty().withMessage('El nombre de usuario es obligatorio')
    .isLength({ min: 3, max: 50 }).withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos')
    .customSanitizer(sanitizeString),
  
  body('nombre')
    .optional({ checkFalsy: true })
    .trim() // Solo eliminar espacios al inicio y final
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('El nombre solo puede contener letras y espacios')
    .customSanitizer((value) => {
      if (!value) return null;
      // Solo eliminar caracteres peligrosos, mantener espacios múltiples
      return value
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
    }),
  
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email debe tener un formato válido')
    .normalizeEmail()
    .isLength({ max: 100 }).withMessage('El email no puede exceder 100 caracteres')
    .customSanitizer(sanitizeEmail),
  
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
    .isLength({ max: 100 }).withMessage('La contraseña no puede exceder 100 caracteres'),
  
  body('role')
    .trim()
    .notEmpty().withMessage('El rol es obligatorio')
    .isIn(['admin', 'empleado']).withMessage('El rol debe ser "admin" o "empleado"')
    .customSanitizer(sanitizeString),
  
  handleValidationErrors
];

/**
 * Validaciones para login
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email debe tener un formato válido')
    .normalizeEmail()
    .customSanitizer(sanitizeEmail),
  
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),
  
  handleValidationErrors
];

/**
 * Validaciones para crear empleado
 */
const validateCreateEmpleado = [
  body('doc_type')
    .trim()
    .notEmpty().withMessage('El tipo de documento es obligatorio')
    .isIn(['CC', 'CE', 'TI', 'PA', 'NIT']).withMessage('El tipo de documento debe ser: CC, CE, TI, PA o NIT')
    .customSanitizer(sanitizeString),
  
  body('doc_number')
    .trim()
    .notEmpty().withMessage('El número de documento es obligatorio')
    .isLength({ min: 5, max: 20 }).withMessage('El número de documento debe tener entre 5 y 20 caracteres')
    .matches(/^[a-zA-Z0-9]+$/).withMessage('El número de documento solo puede contener letras y números')
    .customSanitizer(sanitizeDocument),
  
  body('nombres')
    .trim() // Solo eliminar espacios al inicio y final
    .notEmpty().withMessage('Los nombres son obligatorios')
    .isLength({ min: 2, max: 100 }).withMessage('Los nombres deben tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('Los nombres solo pueden contener letras y espacios')
    .customSanitizer((value) => {
      // Solo eliminar caracteres peligrosos, mantener espacios múltiples
      return value
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
    }),
  
  body('apellidos')
    .trim() // Solo eliminar espacios al inicio y final
    .notEmpty().withMessage('Los apellidos son obligatorios')
    .isLength({ min: 2, max: 100 }).withMessage('Los apellidos deben tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('Los apellidos solo pueden contener letras y espacios')
    .customSanitizer((value) => {
      // Solo eliminar caracteres peligrosos, mantener espacios múltiples
      return value
        .replace(/[<>]/g, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
    }),
  
  body('telefono')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('El teléfono no puede exceder 20 caracteres')
    .customSanitizer((value) => value ? sanitizePhone(value) : null),
  
  body('cargo')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('El cargo no puede exceder 100 caracteres')
    .customSanitizer((value) => value ? sanitizeString(value) : null),
  
  body('fecha_ingreso')
    .notEmpty().withMessage('La fecha de ingreso es obligatoria')
    .isISO8601().withMessage('La fecha de ingreso debe tener formato YYYY-MM-DD')
    .toDate(),
  
  body('base_salary')
    .notEmpty().withMessage('El sueldo básico es obligatorio')
    .isFloat({ min: 0.01 }).withMessage('El sueldo básico debe ser un número mayor a 0')
    .toFloat(),
  
  body('banco')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('El banco no puede exceder 100 caracteres')
    .customSanitizer((value) => value ? sanitizeString(value) : null),
  
  body('cuenta')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('El número de cuenta no puede exceder 50 caracteres')
    .matches(/^[a-zA-Z0-9-]+$/).withMessage('El número de cuenta solo puede contener letras, números y guiones')
    .customSanitizer((value) => value ? sanitizeString(value) : null),
  
  body('status')
    .optional()
    .trim()
    .isIn(['Activo', 'Inactivo']).withMessage('El estado debe ser "Activo" o "Inactivo"')
    .customSanitizer((value) => value ? sanitizeString(value) : 'Activo'),
  
  body('id_usuario')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('El ID de usuario debe ser un número entero positivo')
    .toInt(),
  
  handleValidationErrors
];

/**
 * Validaciones para actualizar empleado
 */
const validateUpdateEmpleado = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt(),
  
  body('doc_type')
    .optional()
    .trim()
    .isIn(['CC', 'CE', 'TI', 'PA', 'NIT']).withMessage('El tipo de documento debe ser: CC, CE, TI, PA o NIT')
    .customSanitizer((value) => value ? sanitizeString(value) : undefined),
  
  body('doc_number')
    .optional()
    .trim()
    .isLength({ min: 5, max: 20 }).withMessage('El número de documento debe tener entre 5 y 20 caracteres')
    .matches(/^[a-zA-Z0-9]+$/).withMessage('El número de documento solo puede contener letras y números')
    .customSanitizer((value) => value ? sanitizeDocument(value) : undefined),
  
  body('nombres')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Los nombres deben tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('Los nombres solo pueden contener letras y espacios')
    .customSanitizer((value) => value ? sanitizeString(value) : undefined),
  
  body('apellidos')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Los apellidos deben tener entre 2 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/).withMessage('Los apellidos solo pueden contener letras y espacios')
    .customSanitizer((value) => value ? sanitizeString(value) : undefined),
  
  body('telefono')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 20 }).withMessage('El teléfono no puede exceder 20 caracteres')
    .customSanitizer((value) => value ? sanitizePhone(value) : null),
  
  body('cargo')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('El cargo no puede exceder 100 caracteres')
    .customSanitizer((value) => value ? sanitizeString(value) : null),
  
  body('fecha_ingreso')
    .optional()
    .isISO8601().withMessage('La fecha de ingreso debe tener formato YYYY-MM-DD')
    .toDate(),
  
  body('base_salary')
    .optional()
    .isFloat({ min: 0.01 }).withMessage('El sueldo básico debe ser un número mayor a 0')
    .toFloat(),
  
  body('banco')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 }).withMessage('El banco no puede exceder 100 caracteres')
    .customSanitizer((value) => value ? sanitizeString(value) : null),
  
  body('cuenta')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 }).withMessage('El número de cuenta no puede exceder 50 caracteres')
    .matches(/^[a-zA-Z0-9-]+$/).withMessage('El número de cuenta solo puede contener letras, números y guiones')
    .customSanitizer((value) => value ? sanitizeString(value) : null),
  
  body('status')
    .optional()
    .trim()
    .isIn(['Activo', 'Inactivo']).withMessage('El estado debe ser "Activo" o "Inactivo"')
    .customSanitizer((value) => value ? sanitizeString(value) : undefined),
  
  handleValidationErrors
];

/**
 * Validaciones para búsqueda de empleados
 */
const validateSearchEmpleados = [
  query('nombre')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El nombre de búsqueda no puede exceder 100 caracteres')
    .customSanitizer((value) => value ? sanitizeString(value) : undefined),
  
  query('doc_number')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('El número de documento no puede exceder 20 caracteres')
    .customSanitizer((value) => value ? sanitizeDocument(value) : undefined),
  
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número entero mayor a 0')
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100')
    .toInt(),
  
  handleValidationErrors
];

/**
 * Validaciones para generar nómina (un solo empleado)
 */
const validateGeneratePayroll = [
  body('id_empleado')
    .notEmpty().withMessage('El ID del empleado es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID del empleado debe ser un número entero positivo')
    .toInt(),
  
  body('periodo_pago')
    .notEmpty().withMessage('El período de pago es obligatorio')
    .isISO8601().withMessage('El período de pago debe tener formato YYYY-MM-DD')
    .toDate(),
  
  body('aplicar_auxilio_transporte')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return typeof value === 'boolean' || value === 'true' || value === 'false';
    }).withMessage('aplicar_auxilio_transporte debe ser un booleano')
    .customSanitizer((value) => {
      if (value === null || value === undefined || value === '') return null;
      if (typeof value === 'boolean') return value;
      return value === 'true' || value === true;
    }),
  
  body('observaciones')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder 1000 caracteres')
    .customSanitizer((value) => value ? sanitizeText(value) : null),
  
  handleValidationErrors
];

/**
 * Validaciones para generar nómina para todos los empleados
 */
const validateGeneratePayrollForAll = [
  body('periodo_pago')
    .notEmpty().withMessage('El período de pago es obligatorio')
    .isISO8601().withMessage('El período de pago debe tener formato YYYY-MM-DD')
    .toDate(),
  
  body('aplicar_auxilio_transporte')
    .optional()
    .custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return typeof value === 'boolean' || value === 'true' || value === 'false';
    }).withMessage('aplicar_auxilio_transporte debe ser un booleano')
    .customSanitizer((value) => {
      if (value === null || value === undefined || value === '') return null;
      if (typeof value === 'boolean') return value;
      return value === 'true' || value === true;
    }),
  
  body('observaciones')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 }).withMessage('Las observaciones no pueden exceder 1000 caracteres')
    .customSanitizer((value) => value ? sanitizeText(value) : null),
  
  handleValidationErrors
];

/**
 * Validaciones para búsqueda de nómina
 */
const validateSearchPayroll = [
  query('nombre')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('El nombre de búsqueda no puede exceder 100 caracteres')
    .customSanitizer((value) => value ? sanitizeString(value) : undefined),
  
  query('doc_number')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('El número de documento no puede exceder 20 caracteres')
    .customSanitizer((value) => value ? sanitizeDocument(value) : undefined),
  
  handleValidationErrors
];

/**
 * Validaciones para eliminar nómina
 */
const validateDeletePayroll = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo')
    .toInt(),
  
  handleValidationErrors
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateEmpleado,
  validateUpdateEmpleado,
  validateSearchEmpleados,
  validateGeneratePayroll,
  validateGeneratePayrollForAll,
  validateSearchPayroll,
  validateDeletePayroll,
  handleValidationErrors
};

