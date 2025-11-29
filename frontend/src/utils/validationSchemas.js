/**
 * @fileoverview Esquemas de validación usando Yup
 * Define esquemas de validación para todos los formularios de la aplicación
 */

import * as yup from 'yup';

/**
 * Esquema de validación para registro de usuario
 */
export const registerSchema = yup.object().shape({
  username: yup
    .string()
    .required('El nombre de usuario es obligatorio')
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede exceder 50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos'),
  
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'El nombre solo puede contener letras y espacios'),
  
  email: yup
    .string()
    .required('El email es obligatorio')
    .email('El email debe tener un formato válido')
    .max(100, 'El email no puede exceder 100 caracteres'),
  
  password: yup
    .string()
    .required('La contraseña es obligatoria')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
  
  role: yup
    .string()
    .required('El rol es obligatorio')
    .oneOf(['admin', 'empleado'], 'El rol debe ser "admin" o "empleado"'),
});

/**
 * Esquema de validación para login
 */
export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required('El email es obligatorio')
    .email('El email debe tener un formato válido'),
  
  password: yup
    .string()
    .required('La contraseña es obligatoria'),
});

/**
 * Esquema de validación para crear/actualizar empleado
 */
export const empleadoSchema = yup.object().shape({
  doc_type: yup
    .string()
    .required('El tipo de documento es obligatorio')
    .oneOf(['CC', 'CE', 'TI', 'PA', 'NIT'], 'El tipo de documento debe ser: CC, CE, TI, PA o NIT'),
  
  doc_number: yup
    .string()
    .required('El número de documento es obligatorio')
    .min(5, 'El número de documento debe tener al menos 5 caracteres')
    .max(20, 'El número de documento no puede exceder 20 caracteres')
    .matches(/^[a-zA-Z0-9]+$/, 'El número de documento solo puede contener letras y números'),
  
  nombres: yup
    .string()
    .required('Los nombres son obligatorios')
    .min(2, 'Los nombres deben tener al menos 2 caracteres')
    .max(100, 'Los nombres no pueden exceder 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'Los nombres solo pueden contener letras y espacios'),
  
  apellidos: yup
    .string()
    .required('Los apellidos son obligatorios')
    .min(2, 'Los apellidos deben tener al menos 2 caracteres')
    .max(100, 'Los apellidos no pueden exceder 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'Los apellidos solo pueden contener letras y espacios'),
  
  telefono: yup
    .string()
    .nullable()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .matches(/^[0-9+\-\s()]*$/, 'El teléfono solo puede contener números y caracteres válidos'),
  
  cargo: yup
    .string()
    .nullable()
    .max(100, 'El cargo no puede exceder 100 caracteres'),
  
  fecha_ingreso: yup
    .date()
    .required('La fecha de ingreso es obligatoria')
    .typeError('La fecha de ingreso debe ser una fecha válida'),
  
  base_salary: yup
    .number()
    .required('El sueldo básico es obligatorio')
    .positive('El sueldo básico debe ser mayor a 0')
    .typeError('El sueldo básico debe ser un número válido'),
  
  banco: yup
    .string()
    .nullable()
    .max(100, 'El banco no puede exceder 100 caracteres'),
  
  cuenta: yup
    .string()
    .nullable()
    .max(50, 'El número de cuenta no puede exceder 50 caracteres')
    .matches(/^[a-zA-Z0-9-]*$/, 'El número de cuenta solo puede contener letras, números y guiones'),
  
  status: yup
    .string()
    .oneOf(['Activo', 'Inactivo'], 'El estado debe ser "Activo" o "Inactivo"')
    .default('Activo'),
});

/**
 * Esquema de validación para generar nómina
 */
export const payrollSchema = yup.object().shape({
  id_empleado: yup
    .number()
    .when('generarParaTodos', {
      is: false,
      then: (schema) => schema.required('El empleado es obligatorio'),
      otherwise: (schema) => schema.nullable(),
    })
    .integer('El ID del empleado debe ser un número entero')
    .positive('El ID del empleado debe ser positivo'),
  
  periodo_pago: yup
    .date()
    .required('El período de pago es obligatorio')
    .typeError('El período de pago debe ser una fecha válida'),
  
  aplicar_auxilio_transporte: yup
    .boolean()
    .nullable()
    .transform((value, originalValue) => {
      if (originalValue === null || originalValue === undefined || originalValue === '') return null;
      return originalValue === true || originalValue === 'true';
    }),
  
  observaciones: yup
    .string()
    .nullable()
    .max(1000, 'Las observaciones no pueden exceder 1000 caracteres'),
});

