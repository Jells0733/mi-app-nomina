/**
 * @fileoverview Componente principal de la aplicación React
 * Configura el enrutamiento y la estructura general de la aplicación
 * Incluye React Query, Lazy Loading y Suspense
 */

import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { queryClient } from './config/queryClient';
import Navbar from './components/Navbar';
import './styles/App.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import { AdminRoute, EmpleadoRoute } from './components/PrivateRoute';

// Componente de carga para Suspense
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    minHeight: '50vh',
    fontSize: '1.2rem',
    color: '#666'
  }}>
    Cargando...
  </div>
);

// Lazy Loading de páginas para Code Splitting
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Home = lazy(() => import('./pages/Home'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));
const EmpleadoPanel = lazy(() => import('./pages/EmpleadoPanel'));
const NotFound = lazy(() => import('./pages/NotFound'));

/**
 * Componente principal de la aplicación
 * Configura el proveedor de autenticación, React Query, enrutamiento y estructura de páginas
 */
const App = () => (
  // Proveedor de React Query para gestión de caché y estado del servidor
  <QueryClientProvider client={queryClient}>
    {/* Proveedor de contexto de autenticación que envuelve toda la aplicación */}
    <AuthProvider>
      {/* Configuración del enrutador de la aplicación */}
      <Router>
        {/* Barra de navegación que se muestra en todas las páginas */}
        <Navbar />
        
        {/* Suspense para manejar la carga de componentes lazy */}
        <Suspense fallback={<LoadingSpinner />}>
          {/* Configuración de rutas de la aplicación */}
          <Routes>
            {/* Ruta pública - Página de inicio */}
            <Route path="/" element={<Home />} />
            
            {/* Rutas públicas de autenticación */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Ruta protegida - Panel de administrador */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
            
            {/* Ruta protegida - Panel de empleado */}
            <Route
              path="/empleado"
              element={
                <EmpleadoRoute>
                  <EmpleadoPanel />
                </EmpleadoRoute>
              }
            />

            {/* Ruta de captura - Página 404 para rutas no encontradas */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
