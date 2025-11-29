/**
 * @fileoverview Configuración de cliente HTTP para comunicación con el backend
 * Utiliza axios para realizar peticiones a la API REST con interceptores
 */

import axios from 'axios';

/**
 * Instancia configurada de axios para realizar peticiones HTTP
 * Configura la URL base y headers por defecto para todas las peticiones
 */
const api = axios.create({
  // URL base de la API, obtiene desde variables de entorno o usa localhost por defecto
  baseURL: process.env.VITE_API_URL || 'http://localhost:4000/api',
  
  // Headers por defecto para todas las peticiones
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de solicitudes
 * Agrega automáticamente el token de autenticación a todas las peticiones
 */
api.interceptors.request.use(
  (config) => {
    // Obtener el token del localStorage
    const token = localStorage.getItem('token');
    
    // Si existe un token, agregarlo al header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    // Manejar errores de configuración de la petición
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respuestas
 * Maneja automáticamente errores de autenticación (401) y otros errores comunes
 */
api.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, retornarla sin modificar
    return response;
  },
  (error) => {
    // Manejar errores de respuesta
    const { response } = error;
    
    if (response) {
      // Error 401: Token expirado o inválido
      if (response.status === 401) {
        // Limpiar datos de autenticación
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirigir al login si no estamos ya ahí
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        // Retornar error con mensaje específico
        return Promise.reject({
          ...error,
          message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          isAuthError: true
        });
      }
      
      // Error 403: Acceso prohibido
      if (response.status === 403) {
        return Promise.reject({
          ...error,
          message: 'No tienes permisos para realizar esta acción.',
          isAuthError: true
        });
      }
      
      // Error 404: Recurso no encontrado
      if (response.status === 404) {
        return Promise.reject({
          ...error,
          message: response.data?.error || 'Recurso no encontrado.',
        });
      }
      
      // Error 500: Error del servidor
      if (response.status >= 500) {
        return Promise.reject({
          ...error,
          message: 'Error del servidor. Por favor, intenta más tarde.',
        });
      }
      
      // Otros errores 4xx
      if (response.status >= 400) {
        return Promise.reject({
          ...error,
          message: response.data?.error || response.data?.message || 'Error en la solicitud.',
        });
      }
    }
    
    // Error de red o sin respuesta
    if (!response) {
      return Promise.reject({
        ...error,
        message: 'Error de conexión. Verifica tu conexión a internet.',
        isNetworkError: true
      });
    }
    
    // Retornar el error original si no se pudo manejar
    return Promise.reject(error);
  }
);

export default api;
