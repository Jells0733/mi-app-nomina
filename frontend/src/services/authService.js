// src/services/authService.js
import api from './api'; // Cliente Axios preconfigurado

/**
 * Iniciar sesión con email y contraseña.
 * Devuelve datos del usuario y token o un mensaje de error.
 */
export const loginUser = async (email, password) => {
  try {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  } catch (error) {
    console.error('Error al iniciar sesión:', error?.response?.data || error.message);
    return { error: error?.response?.data?.error || 'No se pudo iniciar sesión.' };
  }
};

/**
 * Registrar un nuevo usuario.
 * user debe contener:
 * - username
 * - email
 * - password
 * - role
 * - nombre (solo si role === 'empleado')
 * - salario (solo si role === 'empleado')
 * - fecha_ingreso (solo si role === 'empleado')
 */
export const registerUser = async (user) => {
  try {
    const res = await api.post('/auth/register', user);
    return res.data;
  } catch (error) {
    console.error('Error al registrarse:', error?.response?.data || error.message);
    return { error: error?.response?.data?.error || 'No se pudo completar el registro.' };
  }
};
