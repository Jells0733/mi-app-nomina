/**
 * @fileoverview Hook personalizado para gestionar nómina con React Query
 * Proporciona funciones para obtener, generar y eliminar registros de nómina
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPayrolls, generatePayroll, generatePayrollForAll, deletePayroll } from '../services/payrollService';
import { handleError } from '../utils/errorHandler';
import { useNotifications } from './useNotifications';

/**
 * Hook para obtener la lista de registros de nómina
 * @param {Object} options - Opciones de consulta
 * @param {number} options.page - Número de página
 * @param {number} options.limit - Límite de registros por página
 * @param {string} options.nombre - Nombre para filtrar (opcional)
 * @param {string} options.doc_number - Número de documento para filtrar (opcional)
 * @param {string} token - Token de autenticación
 * @returns {Object} Objeto con datos, loading, error y funciones de refetch
 */
export const usePayrolls = (options = {}, token) => {
  const { page = 1, limit = 15, nombre = '', doc_number = '' } = options;
  
  return useQuery({
    queryKey: ['payrolls', page, limit, nombre, doc_number],
    queryFn: () => getPayrolls({ page, limit, nombre, doc_number }, token),
    enabled: !!token, // Solo ejecutar si hay token
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

/**
 * Hook para generar nómina para un empleado
 * @param {string} token - Token de autenticación
 * @returns {Object} Objeto con mutate function y estado de la mutación
 */
export const useGeneratePayroll = (token) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();
  
  return useMutation({
    mutationFn: (payrollData) => generatePayroll(payrollData, token),
    onSuccess: () => {
      // Invalidar y refetch la lista de nómina
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      success('Nómina generada exitosamente');
    },
    onError: (err) => {
      handleError(err, showError);
    },
  });
};

/**
 * Hook para generar nómina para todos los empleados activos
 * @param {string} token - Token de autenticación
 * @returns {Object} Objeto con mutate function y estado de la mutación
 */
export const useGeneratePayrollForAll = (token) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();
  
  return useMutation({
    mutationFn: (payrollData) => generatePayrollForAll(payrollData, token),
    onSuccess: (data) => {
      // Invalidar y refetch la lista de nómina
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      success(`Nómina generada: ${data.exitosos} exitosos, ${data.errores} errores`);
    },
    onError: (err) => {
      handleError(err, showError);
    },
  });
};

/**
 * Hook para eliminar un registro de nómina
 * @param {string} token - Token de autenticación
 * @returns {Object} Objeto con mutate function y estado de la mutación
 */
export const useDeletePayroll = (token) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();
  
  return useMutation({
    mutationFn: (id) => deletePayroll(id, token),
    onSuccess: () => {
      // Invalidar y refetch la lista de nómina
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
      success('Registro de nómina eliminado exitosamente');
    },
    onError: (err) => {
      handleError(err, showError);
    },
  });
};

