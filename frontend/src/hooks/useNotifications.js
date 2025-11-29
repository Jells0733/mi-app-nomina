/**
 * @fileoverview Hook para mostrar notificaciones
 * Proporciona funciones para mostrar notificaciones de diferentes tipos
 */

import { useState, useCallback, useEffect } from 'react';
import { showNotification, setNotificationCallback } from '../utils/notifications';

/**
 * Hook personalizado para manejar notificaciones
 * @returns {Object} Objeto con funciones para mostrar notificaciones y el estado actual
 */
export const useNotifications = () => {
  const [notification, setNotification] = useState(null);

  // Configurar el callback cuando el hook se monta
  useEffect(() => {
    setNotificationCallback((message, type) => {
      setNotification({ message, type, id: Date.now() });
      
      // Auto-ocultar después de 5 segundos
      setTimeout(() => {
        setNotification(null);
      }, 5000);
    });
  }, []);

  const notify = useCallback((message, type = 'info') => {
    showNotification(message, type);
  }, []);

  const success = useCallback((message) => {
    notify(message, 'success');
  }, [notify]);

  const error = useCallback((message) => {
    notify(message, 'error');
  }, [notify]);

  const warning = useCallback((message) => {
    notify(message, 'warning');
  }, [notify]);

  const info = useCallback((message) => {
    notify(message, 'info');
  }, [notify]);

  return {
    notification,
    notify,
    success,
    error,
    warning,
    info,
  };
};

