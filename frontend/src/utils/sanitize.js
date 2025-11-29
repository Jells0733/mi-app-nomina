/**
 * @fileoverview Utilidades para sanitización de datos en el frontend
 * Funciones auxiliares para limpiar y sanitizar inputs del usuario antes de enviarlos
 */

/**
 * Sanitiza un string eliminando caracteres peligrosos y HTML
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizado
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  
  return str
    .trim() // Solo eliminar espacios al inicio y final
    .replace(/[<>]/g, '') // Eliminar < y >
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+=/gi, ''); // Eliminar event handlers
  // NO normalizar espacios múltiples - permitir "Juan Carlos", "De la Torre", etc.
};

/**
 * Sanitiza un email
 * @param {string} email - Email a sanitizar
 * @returns {string} Email sanitizado
 */
export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * Sanitiza un documento (solo números y letras)
 * @param {string} doc - Documento a sanitizar
 * @returns {string} Documento sanitizado
 */
export const sanitizeDocument = (doc) => {
  if (typeof doc !== 'string') return '';
  return doc.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

/**
 * Sanitiza un teléfono (solo números, +, espacios y guiones)
 * @param {string} phone - Teléfono a sanitizar
 * @returns {string} Teléfono sanitizado
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return '';
  return phone.trim().replace(/[^0-9+\-\s()]/g, '');
};

/**
 * Sanitiza un texto largo (observaciones, etc.)
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Eliminar scripts
    .replace(/<[^>]+>/g, '') // Eliminar tags HTML
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/\s+/g, ' '); // Normalizar espacios
};

/**
 * Valida y sanitiza un username
 * @param {string} username - Username a validar y sanitizar
 * @returns {string|null} Username sanitizado o null si es inválido
 */
export const validateAndSanitizeUsername = (username) => {
  if (typeof username !== 'string') return null;
  const sanitized = sanitizeString(username);
  if (sanitized.length < 3 || sanitized.length > 50) return null;
  if (!/^[a-zA-Z0-9_]+$/.test(sanitized)) return null;
  return sanitized;
};

/**
 * Valida y sanitiza un email
 * @param {string} email - Email a validar y sanitizar
 * @returns {string|null} Email sanitizado o null si es inválido
 */
export const validateAndSanitizeEmail = (email) => {
  if (typeof email !== 'string') return null;
  const sanitized = sanitizeEmail(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) return null;
  return sanitized;
};

/**
 * Valida una contraseña
 * @param {string} password - Contraseña a validar
 * @returns {boolean} true si la contraseña es válida
 */
export const validatePassword = (password) => {
  if (typeof password !== 'string') return false;
  return password.length >= 6 && password.length <= 100;
};

/**
 * Sanitiza un número
 * @param {any} value - Valor a sanitizar
 * @returns {number|null} Número sanitizado o null si no es válido
 */
export const sanitizeNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

