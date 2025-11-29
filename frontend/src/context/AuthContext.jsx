/**
 * @fileoverview Contexto de autenticación
 * Proporciona estado global para la autenticación de usuarios en toda la aplicación
 */

import React, { createContext, useState } from 'react';

// Crear el contexto de autenticación
export const AuthContext = createContext();

/**
 * Proveedor del contexto de autenticación
 * Maneja el estado del usuario autenticado y el token JWT
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos
 */
export const AuthProvider = ({ children }) => {
  /**
   * Estado del usuario autenticado
   * Se inicializa desde localStorage si existe, sino es null
   */
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      console.warn('Error al parsear user desde localStorage:', error);
      return null;
    }
  });

  /**
   * Estado del token JWT
   * Se inicializa desde localStorage si existe, sino es string vacío
   */
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('token') || '';
    } catch {
      return '';
    }
  });

  /**
   * Función para iniciar sesión
   * Actualiza el estado del usuario y token, y los guarda en localStorage
   * @param {Object} userData - Datos del usuario autenticado
   * @param {string} jwt - Token JWT del usuario
   */
  const login = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', jwt);
  };

  /**
   * Función para cerrar sesión
   * Limpia el estado del usuario y token, y los elimina de localStorage
   */
  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  // Proporcionar el contexto con el estado y las funciones de autenticación
  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
