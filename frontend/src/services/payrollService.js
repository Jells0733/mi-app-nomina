import api from './api';

const authHeader = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

/**
 * Obtener registros de nómina desde la API.
 * @param {string} token - Token de autenticación
 * @param {Object} params - Parámetros de consulta (page, limit, id_empleado)
 * @returns {Promise<Array>} Array de registros de nómina
 */
export const getPayrolls = async (token, params = {}) => {
  try {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.id_empleado) queryParams.append('id_empleado', params.id_empleado);

    const url = `/payroll${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const res = await api.get(url, authHeader(token));
    const data = res.data;

    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.data)) return data.data;

    console.warn('Respuesta inesperada de nómina:', data);
    return [];
  } catch (err) {
    console.error('Error al obtener nómina:', err?.response?.data || err.message);
    return [];
  }
};

/**
 * Obtener un registro de nómina por ID.
 * @param {number} id - ID del registro
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object|null>} Registro de nómina o null
 */
export const getPayroll = async (id, token) => {
  try {
    const res = await api.get(`/payroll/${id}`, authHeader(token));
    return res.data;
  } catch (err) {
    console.error('Error al obtener nómina:', err?.response?.data || err.message);
    return null;
  }
};

/**
 * Generar un nuevo registro de nómina para un empleado.
 * @param {Object} payrollData - Datos de la nómina
 * @param {number} payrollData.id_empleado - ID del empleado
 * @param {string} payrollData.periodo_pago - Fecha del período (YYYY-MM-DD)
 * @param {boolean} payrollData.aplicar_auxilio_transporte - Si aplicar auxilio de transporte
 * @param {string} payrollData.observaciones - Observaciones opcionales
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object|null>} Registro creado o null
 */
export const generatePayroll = async (payrollData, token) => {
  try {
    const res = await api.post('/payroll', payrollData, authHeader(token));
    return res.data;
  } catch (err) {
    console.error('Error al generar nómina:', err?.response?.data || err.message);
    throw err;
  }
};

/**
 * Generar nómina para todos los empleados activos.
 * @param {Object} payrollData - Datos de la nómina
 * @param {string} payrollData.periodo_pago - Fecha del período (YYYY-MM-DD)
 * @param {boolean} payrollData.aplicar_auxilio_transporte - Si aplicar auxilio de transporte
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} Resultado de la generación masiva
 */
export const generatePayrollForAll = async (payrollData, token) => {
  try {
    const res = await api.post('/payroll/generate-all', payrollData, authHeader(token));
    return res.data;
  } catch (err) {
    console.error('Error al generar nómina masiva:', err?.response?.data || err.message);
    throw err;
  }
};

/**
 * Eliminar un registro de nómina.
 * @param {number} id - ID del registro
 * @param {string} token - Token de autenticación
 * @returns {Promise<boolean>} true si se eliminó correctamente
 */
export const deletePayroll = async (id, token) => {
  try {
    await api.delete(`/payroll/${id}`, authHeader(token));
    return true;
  } catch (err) {
    console.error('Error al eliminar nómina:', err?.response?.data || err.message);
    return false;
  }
};

