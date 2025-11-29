/**
 * @fileoverview Utilidades para SweetAlert2
 * Funciones personalizadas para mostrar alertas y confirmaciones consistentes
 */

import Swal from 'sweetalert2';

/**
 * Muestra una alerta de éxito
 * @param {string} message - Mensaje a mostrar
 * @param {string} title - Título (opcional)
 */
export const showSuccess = (message, title = '¡Éxito!') => {
  return Swal.fire({
    icon: 'success',
    title: title,
    text: message,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#28a745',
    timer: 3000,
    timerProgressBar: true
  });
};

/**
 * Muestra una alerta de error
 * @param {string} message - Mensaje a mostrar
 * @param {string} title - Título (opcional)
 */
export const showError = (message, title = 'Error') => {
  return Swal.fire({
    icon: 'error',
    title: title,
    text: message,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#dc3545'
  });
};

/**
 * Muestra una alerta de advertencia
 * @param {string} message - Mensaje a mostrar
 * @param {string} title - Título (opcional)
 */
export const showWarning = (message, title = 'Advertencia') => {
  return Swal.fire({
    icon: 'warning',
    title: title,
    text: message,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#ffc107',
    confirmButtonTextColor: '#000'
  });
};

/**
 * Muestra una alerta informativa
 * @param {string} message - Mensaje a mostrar
 * @param {string} title - Título (opcional)
 */
export const showInfo = (message, title = 'Información') => {
  return Swal.fire({
    icon: 'info',
    title: title,
    text: message,
    confirmButtonText: 'Aceptar',
    confirmButtonColor: '#007bff'
  });
};

/**
 * Muestra una confirmación
 * @param {string} message - Mensaje a mostrar
 * @param {string} title - Título (opcional)
 * @param {string} confirmText - Texto del botón de confirmación (opcional)
 * @param {string} cancelText - Texto del botón de cancelar (opcional)
 * @returns {Promise<boolean>} true si se confirma, false si se cancela
 */
export const showConfirm = async (
  message,
  title = 'Confirmar',
  confirmText = 'Sí, continuar',
  cancelText = 'Cancelar'
) => {
  const result = await Swal.fire({
    icon: 'question',
    title: title,
    text: message,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: '#007bff',
    cancelButtonColor: '#6c757d',
    reverseButtons: true
  });

  return result.isConfirmed;
};

/**
 * Muestra una confirmación de eliminación
 * @param {string} message - Mensaje a mostrar
 * @param {string} title - Título (opcional)
 * @returns {Promise<boolean>} true si se confirma, false si se cancela
 */
export const showDeleteConfirm = async (
  message = 'Esta acción no se puede deshacer',
  title = '¿Está seguro?'
) => {
  return showConfirm(message, title, 'Sí, eliminar', 'Cancelar');
};

/**
 * Muestra una confirmación de acción (activar/desactivar)
 * @param {string} action - Acción a realizar (ej: "activar", "desactivar")
 * @param {string} item - Item sobre el que se realizará la acción (opcional)
 * @returns {Promise<boolean>} true si se confirma, false si se cancela
 */
export const showActionConfirm = async (action, item = 'este elemento') => {
  return showConfirm(
    `¿Está seguro de ${action} ${item}?`,
    'Confirmar acción',
    `Sí, ${action}`,
    'Cancelar'
  );
};

/**
 * Muestra una alerta simple (reemplazo de alert nativo)
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo: 'success', 'error', 'warning', 'info' (default: 'info')
 */
export const showAlert = (message, type = 'info') => {
  switch (type) {
    case 'success':
      return showSuccess(message);
    case 'error':
      return showError(message);
    case 'warning':
      return showWarning(message);
    default:
      return showInfo(message);
  }
};

