/**
 * @fileoverview Hook personalizado para gestionar empleados con React Query
 * Proporciona funciones para obtener, crear, actualizar y eliminar empleados
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getEmpleados, createEmpleado, updateEmpleado, deleteEmpleado } from '../services/empleadoService';
import { handleError } from '../utils/errorHandler';
import { useNotifications } from './useNotifications';

/**
 * Hook para obtener la lista de empleados con paginación y búsqueda
 * @param {Object} options - Opciones de consulta
 * @param {number} options.page - Número de página
 * @param {number} options.limit - Límite de registros por página
 * @param {string} options.nombre - Nombre para filtrar (opcional)
 * @param {string} options.doc_number - Número de documento para filtrar (opcional)
 * @param {string} token - Token de autenticación
 * @returns {Object} Objeto con datos, loading, error y funciones de refetch
 */
export const useEmpleados = (options = {}, token) => {
  const { page = 1, limit = 15, nombre = '', doc_number = '' } = options;
  
  return useQuery({
    queryKey: ['empleados', page, limit, nombre, doc_number],
    queryFn: () => getEmpleados({ page, limit, nombre, doc_number }, token),
    enabled: !!token, // Solo ejecutar si hay token
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

/**
 * Hook para crear un nuevo empleado
 * @param {string} token - Token de autenticación
 * @returns {Object} Objeto con mutate function y estado de la mutación
 */
export const useCreateEmpleado = (token) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();
  
  return useMutation({
    mutationFn: (empleadoData) => createEmpleado(empleadoData, token),
    onSuccess: () => {
      // Invalidar y refetch la lista de empleados
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
      success('Empleado creado exitosamente');
    },
    onError: (err) => {
      const message = handleError(err, showError);
      showError(message);
    },
  });
};

/**
 * Hook para actualizar un empleado
 * @param {string} token - Token de autenticación
 * @returns {Object} Objeto con mutate function y estado de la mutación
 */
export const useUpdateEmpleado = (token) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();
  
  return useMutation({
    mutationFn: ({ id, data }) => updateEmpleado(id, data, token),
    onSuccess: () => {
      // Invalidar y refetch la lista de empleados
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
      success('Empleado actualizado exitosamente');
    },
    onError: (err) => {
      handleError(err, showError);
    },
  });
};

/**
 * Hook para eliminar (soft delete) un empleado
 * @param {string} token - Token de autenticación
 * @returns {Object} Objeto con mutate function y estado de la mutación
 */
export const useDeleteEmpleado = (token) => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();
  
  return useMutation({
    mutationFn: (id) => deleteEmpleado(id, token),
    onSuccess: () => {
      // Invalidar y refetch la lista de empleados
      queryClient.invalidateQueries({ queryKey: ['empleados'] });
      success('Empleado desactivado exitosamente');
    },
    onError: (err) => {
      handleError(err, showError);
    },
  });
};

