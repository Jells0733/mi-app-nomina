/**
 * @fileoverview Utilidad para manejo centralizado de errores
 * Proporciona funciones para mostrar errores de forma amigable al usuario
 */

import { showError } from './swal';

/**
 * Obtiene un mensaje de error amigable desde un error de axios
 * @param {Error} error - Error capturado
 * @returns {string} Mensaje de error amigable
 */
export const getErrorMessage = (error) => {
  // Si el error ya tiene un mensaje amigable, usarlo
  if (error?.message) {
    return error.message;
  }
  
  // Si hay una respuesta del servidor con detalles
  if (error?.response?.data) {
    const data = error.response.data;
    
    // Si hay un mensaje de error específico
    if (data.error) {
      return data.error;
    }
    
    // Si hay un array de errores de validación
    if (data.details && Array.isArray(data.details)) {
      return data.details.map(d => d.message).join(', ');
    }
    
    // Si hay un mensaje genérico
    if (data.message) {
      return data.message;
    }
  }
  
  // Mensaje por defecto
  return 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.';
};

/**
 * Muestra una notificación de error al usuario
 * @param {Error} error - Error capturado
 * @param {Function} showNotification - Función para mostrar notificación (opcional)
 */
export const handleError = (error, showNotification = null) => {
  const message = getErrorMessage(error);
  
  // Si se proporciona una función de notificación, usarla
  if (showNotification && typeof showNotification === 'function') {
    showNotification(message, 'error');
    return;
  }
  
  // Por defecto, usar SweetAlert2
  console.error('Error:', error);
  showError(message);
};

/**
 * Clasifica el tipo de error
 * @param {Error} error - Error capturado
 * @returns {Object} Objeto con información del tipo de error
 */
export const classifyError = (error) => {
  if (error?.isAuthError) {
    return { type: 'auth', severity: 'high' };
  }
  
  if (error?.isNetworkError) {
    return { type: 'network', severity: 'high' };
  }
  
  if (error?.response) {
    const status = error.response.status;
    
    if (status >= 500) {
      return { type: 'server', severity: 'high' };
    }
    
    if (status >= 400) {
      return { type: 'client', severity: 'medium' };
    }
  }
  
  return { type: 'unknown', severity: 'medium' };
};

