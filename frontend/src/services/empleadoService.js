import api from './api';

const authHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

/**
 * Obtener empleados desde la API con paginación.
 * @param {string} token - Token de autenticación
 * @param {Object} params - Parámetros de paginación { page, limit, nombre, status }
 * @returns {Promise<Object>} Objeto con { data, page, limit, total, totalPages }
 */
export const getEmpleados = async (token, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.nombre) queryParams.append('nombre', params.nombre);
    if (params.documento) queryParams.append('documento', params.documento);
    if (params.status) queryParams.append('status', params.status);

    const url = `/empleados${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res = await api.get(url, authHeader(token));
    const data = res.data;

    // Si la respuesta es paginada, retornarla completa
    if (data && typeof data === 'object' && 'data' in data) {
      return {
        data: data.data || [],
        page: data.page || 1,
        limit: data.limit || 10,
        total: data.total || 0,
        totalPages: data.totalPages || 1
      };
    }

    // Si es un array directo (compatibilidad hacia atrás)
    if (Array.isArray(data)) {
      return {
        data: data,
        page: 1,
        limit: data.length,
        total: data.length,
        totalPages: 1
      };
    }

    console.warn('Respuesta inesperada de empleados:', data);
    return { data: [], page: 1, limit: 10, total: 0, totalPages: 1 };
  } catch (err) {
    console.error('Error al obtener empleados:', err?.response?.data || err.message);
    return { data: [], page: 1, limit: 10, total: 0, totalPages: 1 };
  }
};

/**
 * Crear un nuevo empleado en la base de datos.
 * Devuelve el empleado creado o null si falla.
 */
export const createEmpleado = async (empleado, token) => {
  try {
    const res = await api.post('/empleados', empleado, authHeader(token));
    const data = res.data;

    if (!data || !data.id) {
      console.warn('Empleado creado sin ID. Respuesta:', data);
      throw new Error('El empleado se creó pero no se recibió un ID válido');
    }

    return data;
  } catch (err) {
    console.error('Error al crear empleado:', err?.response?.data || err.message);
    // Propagar el error para que el componente pueda manejarlo correctamente
    throw err;
  }
};
/**
 * Actualizar un empleado existente.
 * @param {number} id - ID del empleado
 * @param {Object} data - Datos a actualizar
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object|null>} Empleado actualizado o null
 */
export const updateEmpleado = async (id, data, token) => {
  try {
    const res = await api.put(`/empleados/${id}`, data, authHeader(token));
    return res.data;
  } catch (err) {
    console.error('Error al actualizar empleado:', err?.response?.data || err.message);
    return null;
  }
};

/**
 * Obtener un empleado por su ID.
 * @param {number} id - ID del empleado
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object|null>} Empleado o null
 */
export const getEmpleado = async (id, token) => {
  try {
    const res = await api.get(`/empleados/${id}`, authHeader(token));
    return res.data;
  } catch (err) {
    console.error('Error al obtener empleado:', err?.response?.data || err.message);
    return null;
  }
};

/**
 * Eliminar (desactivar) un empleado.
 * @param {number} id - ID del empleado
 * @param {string} token - Token de autenticación
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export const deleteEmpleado = async (id, token) => {
  try {
    await api.delete(`/empleados/${id}`, authHeader(token));
    return true;
  } catch (err) {
    console.error('Error al eliminar empleado:', err?.response?.data || err.message);
    return false;
  }
};

/**
 * Obtener el ID del empleado asociado al usuario autenticado.
 * @param {string} token - Token de autenticación
 * @returns {Promise<number|null>} ID del empleado o null
 */
export const getEmpleadoIdByUsuario = async (token) => {
  try {
    const res = await api.get('/empleados/mi-id', authHeader(token));
    return res.data?.id || null;
  } catch (err) {
    console.error('Error al obtener ID de empleado:', err?.response?.data || err.message);
    return null;
  }
};