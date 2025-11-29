/**
 * @fileoverview Componentes de rutas protegidas
 * Proporciona componentes para proteger rutas basadas en autenticación y roles
 */

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * Componente de ruta privada que requiere autenticación
 * Redirige a /login si el usuario no está autenticado
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos a renderizar si está autenticado
 * @returns {React.ReactNode} Componentes hijos o redirección a login
 */
export const PrivateRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user ? children : <Navigate to="/login" />;
};

/**
 * Componente de ruta que requiere rol de administrador
 * Redirige a / si el usuario no es administrador
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos a renderizar si es admin
 * @returns {React.ReactNode} Componentes hijos o redirección a home
 */
export const AdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user?.role === 'admin' ? children : <Navigate to="/" />;
};

/**
 * Componente de ruta que requiere rol de empleado
 * Redirige a / si el usuario no es empleado
 * @param {Object} props - Propiedades del componente
 * @param {React.ReactNode} props.children - Componentes hijos a renderizar si es empleado
 * @returns {React.ReactNode} Componentes hijos o redirección a home
 */
export const EmpleadoRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  return user?.role === 'empleado' ? children : <Navigate to="/" />;
};
