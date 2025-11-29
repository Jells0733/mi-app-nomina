/**
 * @fileoverview Configuración de React Query
 * Configura el QueryClient con opciones optimizadas para caché y refetch
 */

import { QueryClient } from '@tanstack/react-query';

/**
 * QueryClient configurado con opciones optimizadas
 * - Cache de 5 minutos por defecto
 * - Refetch automático deshabilitado en ventana enfocada (para evitar peticiones innecesarias)
 * - Retry automático en caso de error de red
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran "frescos" (5 minutos)
      staleTime: 5 * 60 * 1000,
      
      // Tiempo que los datos se mantienen en caché (10 minutos)
      cacheTime: 10 * 60 * 1000,
      
      // No refetch automático cuando la ventana recupera el foco
      refetchOnWindowFocus: false,
      
      // No refetch automático al reconectar
      refetchOnReconnect: false,
      
      // Reintentar automáticamente en caso de error (hasta 3 veces)
      retry: 3,
      
      // Tiempo entre reintentos (1 segundo)
      retryDelay: 1000,
    },
    mutations: {
      // Reintentar mutaciones en caso de error de red
      retry: 1,
    },
  },
});

