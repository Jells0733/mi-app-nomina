/**
 * @fileoverview Utilidades para sanitización de datos
 * Funciones auxiliares para limpiar y sanitizar inputs del usuario
 */

/**
 * Sanitiza un string eliminando caracteres peligrosos y HTML
 * @param {string} str - String a sanitizar
 * @returns {string} String sanitizado
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  
  return str
    .trim() // Solo eliminar espacios al inicio y final
    .replace(/[<>]/g, '') // Eliminar < y >
    .replace(/javascript:/gi, '') // Eliminar javascript:
    .replace(/on\w+=/gi, ''); // Eliminar event handlers (onclick=, onerror=, etc.)
  // NO normalizar espacios múltiples - permitir "Juan Carlos", "De la Torre", etc.
};

/**
 * Sanitiza un número, asegurándose de que sea válido
 * @param {any} value - Valor a sanitizar
 * @returns {number|null} Número sanitizado o null si no es válido
 */
const sanitizeNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
};

/**
 * Sanitiza un email
 * @param {string} email - Email a sanitizar
 * @returns {string} Email sanitizado
 */
const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

/**
 * Sanitiza un documento (solo números y letras)
 * @param {string} doc - Documento a sanitizar
 * @returns {string} Documento sanitizado
 */
const sanitizeDocument = (doc) => {
  if (typeof doc !== 'string') return '';
  return doc.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
};

/**
 * Sanitiza un teléfono (solo números, +, espacios y guiones)
 * @param {string} phone - Teléfono a sanitizar
 * @returns {string} Teléfono sanitizado
 */
const sanitizePhone = (phone) => {
  if (typeof phone !== 'string') return '';
  return phone.trim().replace(/[^0-9+\-\s()]/g, '');
};

/**
 * Sanitiza un texto largo (observaciones, etc.)
 * @param {string} text - Texto a sanitizar
 * @returns {string} Texto sanitizado
 */
const sanitizeText = (text) => {
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
 * Valida y sanitiza un objeto completo
 * @param {Object} data - Objeto a sanitizar
 * @param {Object} schema - Esquema de sanitización { campo: 'tipo' }
 * @returns {Object} Objeto sanitizado
 */
const sanitizeObject = (data, schema) => {
  const sanitized = {};
  
  for (const [key, type] of Object.entries(schema)) {
    if (data[key] === undefined || data[key] === null) {
      sanitized[key] = null;
      continue;
    }
    
    switch (type) {
      case 'string':
        sanitized[key] = sanitizeString(data[key]);
        break;
      case 'email':
        sanitized[key] = sanitizeEmail(data[key]);
        break;
      case 'number':
        sanitized[key] = sanitizeNumber(data[key]);
        break;
      case 'document':
        sanitized[key] = sanitizeDocument(data[key]);
        break;
      case 'phone':
        sanitized[key] = sanitizePhone(data[key]);
        break;
      case 'text':
        sanitized[key] = sanitizeText(data[key]);
        break;
      default:
        sanitized[key] = data[key];
    }
  }
  
  return sanitized;
};

module.exports = {
  sanitizeString,
  sanitizeNumber,
  sanitizeEmail,
  sanitizeDocument,
  sanitizePhone,
  sanitizeText,
  sanitizeObject
};

