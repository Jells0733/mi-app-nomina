/**
 * @fileoverview Utilidades para sanitización de HTML usando DOMPurify
 * Previene ataques XSS al limpiar HTML antes de renderizarlo
 */

import DOMPurify from 'dompurify';

/**
 * Configuración por defecto para DOMPurify
 * Permite solo texto y algunos elementos básicos seguros
 */
const defaultConfig = {
  ALLOWED_TAGS: [], // Por defecto, no permitir tags HTML
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true, // Mantener el contenido de texto
};

/**
 * Sanitiza un string eliminando todo HTML y scripts
 * @param {string} dirty - String a sanitizar
 * @param {Object} config - Configuración personalizada (opcional)
 * @returns {string} String sanitizado
 */
export const sanitize = (dirty, config = {}) => {
  if (typeof dirty !== 'string') return '';
  
  const finalConfig = { ...defaultConfig, ...config };
  return DOMPurify.sanitize(dirty, finalConfig);
};

/**
 * Sanitiza un string permitiendo solo texto plano
 * @param {string} dirty - String a sanitizar
 * @returns {string} String sanitizado (solo texto)
 */
export const sanitizeText = (dirty) => {
  if (typeof dirty !== 'string') return '';
  
  const sanitized = sanitize(dirty, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });
  
  // Solo eliminar espacios al inicio y final, mantener espacios múltiples en el medio
  return sanitized.trim();
};

/**
 * Sanitiza un string permitiendo algunos tags HTML básicos y seguros
 * Útil para campos como observaciones donde se puede permitir formato básico
 * @param {string} dirty - String a sanitizar
 * @returns {string} String sanitizado con tags HTML seguros
 */
export const sanitizeHTML = (dirty) => {
  return sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
  });
};

/**
 * Sanitiza un objeto completo aplicando sanitización a todos los strings
 * @param {Object} obj - Objeto a sanitizar
 * @param {Object} config - Configuración personalizada (opcional)
 * @returns {Object} Objeto sanitizado
 */
export const sanitizeObject = (obj, config = {}) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitize(value, config);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, config);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

