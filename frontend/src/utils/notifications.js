/**
 * @fileoverview Sistema de notificaciones usando SweetAlert2
 * Reexporta las funciones de swal.js para mantener compatibilidad
 */

import { 
  showSuccess as swalSuccess, 
  showError as swalError, 
  showWarning as swalWarning, 
  showInfo as swalInfo,
  showAlert as swalAlert
} from './swal';

/**
 * Estado global para notificaciones (mantenido para compatibilidad)
 */
let notificationCallback = null;

/**
 * Configura el callback para mostrar notificaciones
 * @param {Function} callback - Función que recibe (message, type)
 */
export const setNotificationCallback = (callback) => {
  notificationCallback = callback;
};

/**
 * Muestra una notificación
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación: 'success', 'error', 'warning', 'info'
 */
export const showNotification = (message, type = 'info') => {
  if (notificationCallback) {
    notificationCallback(message, type);
  } else {
    // Usar SweetAlert2 como fallback
    swalAlert(message, type);
  }
};

/**
 * Muestra una notificación de éxito
 */
export const showSuccess = (message) => {
  if (notificationCallback) {
    notificationCallback(message, 'success');
  } else {
    swalSuccess(message);
  }
};

/**
 * Muestra una notificación de error
 */
export const showError = (message) => {
  if (notificationCallback) {
    notificationCallback(message, 'error');
  } else {
    swalError(message);
  }
};

/**
 * Muestra una notificación de advertencia
 */
export const showWarning = (message) => {
  if (notificationCallback) {
    notificationCallback(message, 'warning');
  } else {
    swalWarning(message);
  }
};

/**
 * Muestra una notificación informativa
 */
export const showInfo = (message) => {
  if (notificationCallback) {
    notificationCallback(message, 'info');
  } else {
    swalInfo(message);
  }
};

